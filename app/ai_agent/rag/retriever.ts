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
  {
    id: "NEPAL-CAS-01",
    title: "Nepal Langtang Lirung Trigger & Avalanche Physics",
    content: "On 2026-08-26 at 08:37:10 NPT, a catastrophic 6.8 million m³ rock-ice collapse occurred on the north flank of Langtang Lirung (7,234m). The seismic signature was equivalent to an M5.2 event. The massive glacial collapse initiated a hyper-concentrated sediment and debris flood down the Langtang / Trishuli river corridor.",
    sector: "Nepal-Replay",
  },
  {
    id: "NEPAL-CAS-02",
    title: "Rasuwagadhi Border & Syabrubesi Downstream Propagation",
    content: "At ~08:44 NPT (6-7 min post-trigger), the flood pulse hit Rasuwagadhi border (Km 14) damaging the Miteri Friendship Bridge. The last reading was 1.62m before sensor compromise. By 09:00-09:25 NPT, water level at Syabrubesi (Km 28) reached +6.2m, destroying suspension bridges and severing Pasang Lhamu Highway (NH09). At 09:00 NPT, Dhunche command received telephone human reports due to sensor degradation.",
    sector: "Nepal-Replay",
  },
  {
    id: "NEPAL-CAS-03",
    title: "Mass Warning SMS Alert & Betrawati-Galchhi Flood Surge",
    content: "At 09:15-09:16 NPT, DHM/civil defense issued 679,295 emergency mass SMS alerts to downstream populations. Betrawati gauge (Km 56) recorded 3.55m at 10:15 NPT before failure. At Galchhi (Km 82, Dhading confluence), water surged +9m in 30 minutes reaching 11.1m (danger level 9.0m) at 10:28 NPT, causing major inundation along the Prithvi Highway (H04/NH41).",
    sector: "Nepal-Replay",
  },
  {
    id: "NEPAL-CAS-04",
    title: "Secondary Seismic Event & Lower Basin Inundation (Muglin, Kalikhola, Devghat)",
    content: "At 11:45 NPT, a secondary seismic/mass movement (M4.2) struck upper Rasuwa. The flood wave propagated to Muglin (Km 135) at 13:00 NPT (11.5m) and Kalikhola (Km 142) at 14:14 NPT (12.3m, exceeding 10.5m danger threshold). At Devghat hydro-terminal (Km 165), peak water level was recorded at 6.57m at 16:00 NPT before receding substantially by 18:30 NPT. Alternate freight diverted via BP Highway (H06).",
    sector: "Nepal-Replay",
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
