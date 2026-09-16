import prisma from "@/backend/db/prisma";
import { defaultEmbedder, IEmbeddingProvider } from "./embeddings";
import { globalVectorStore, VectorStore } from "../vector_db/store";

export interface RetrievedDocument {
  collection: string;
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

export interface RagOptions {
  topK?: number;
  minSimilarity?: number;
}

const TALLINN_STANDARD_OPERATING_PROCEDURES = [
  {
    id: "SOP-GRID-01",
    title: "Substation Cascade Mitigation Protocol",
    content: "When substation voltage exceeds 420kV tolerances or frequency drops below 49.2 Hz, disconnect non-essential secondary circuits within 180 seconds. Maintain dedicated feeders to Ida-Tallinna Keskhaigla and Lääne-Tallinna Keskhaigla.",
    sector: "Grid",
  },
  {
    id: "SOP-TRF-02",
    title: "Old Town & Viru Ring Corridor Emergency Clearway",
    content: "In case of traffic signal controller freeze at Viru or Balti Jaam, force amber-flash mode immediately. Shift southbound outbound flow to Tehnika street and Suur-Ameerika.",
    sector: "Traffic",
  },
  {
    id: "SOP-DISP-03",
    title: "Priority Maritime Response in Tallinn Bay",
    content: "During port communication blackout or AIS degradation, patrol vessel EVA-316 maintains visual radar stationing. Coast Guard channels 16 and 67 active for vessel guidance.",
    sector: "Maritime",
  },
];

export class RagRetriever {
  private embedder: IEmbeddingProvider;
  private vectorStore: VectorStore;
  private initialized = false;

  constructor(embedder = defaultEmbedder, vectorStore = globalVectorStore) {
    this.embedder = embedder;
    this.vectorStore = vectorStore;
  }

  private async initializeSopKnowledge(): Promise<void> {
    if (this.initialized) return;

    for (const sop of TALLINN_STANDARD_OPERATING_PROCEDURES) {
      const embedding = await this.embedder.embed(sop.content);
      this.vectorStore.upsert({
        id: sop.id,
        content: `[SOP - ${sop.title}]: ${sop.content}`,
        embedding,
        metadata: { sector: sop.sector, type: "sop" },
      });
    }

    this.initialized = true;
  }

  async retrieveContext(query: string, options?: RagOptions): Promise<RetrievedDocument[]> {
    await this.initializeSopKnowledge();

    const topK = options?.topK ?? 5;
    const minSimilarity = options?.minSimilarity ?? 0.15;
    const queryEmbedding = await this.embedder.embed(query);

    // 1. Vector search in standard knowledge base
    const vectorResults = this.vectorStore.query(queryEmbedding, {
      topK,
      minSimilarity,
    });

    const results: RetrievedDocument[] = vectorResults.map((res) => ({
      collection: (res.record.metadata?.type as string) || "sop_knowledge",
      content: res.record.content,
      similarity: Number(res.similarity.toFixed(3)),
      metadata: res.record.metadata,
    }));

    // 2. Fetch live incidents matching keywords
    try {
      const queryLower = query.toLowerCase();
      const recentIncidents = await prisma.incident.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
      });

      for (const inc of recentIncidents) {
        const text = `Live Incident ${inc.id} [${inc.severity.toUpperCase()}]: ${inc.title} - ${inc.description} (District: ${inc.district || "Tallinn"})`;
        if (
          queryLower.includes(inc.severity.toLowerCase()) ||
          queryLower.includes((inc.district || "").toLowerCase()) ||
          queryLower.includes("incident") ||
          queryLower.includes("anomaly") ||
          queryLower.includes("grid")
        ) {
          results.push({
            collection: "live_incidents",
            content: text,
            similarity: 0.85,
            metadata: { id: inc.id, severity: inc.severity, district: inc.district },
          });
        }
      }
    } catch {
      // Database query error ignored in RAG fallback
    }

    // Sort descending by relevance
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topK);
  }
}

export const ragRetriever = new RagRetriever();
