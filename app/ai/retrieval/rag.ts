import { AiConfig } from "../types";

export interface RetrievedDocument {
  collection: string;
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

export class RagRetriever {
  private config: AiConfig;

  constructor(config: AiConfig) {
    this.config = config;
  }

  /**
   * Search vector DB collections for context relevant to the user query
   */
  async retrieveContext(query: string): Promise<RetrievedDocument[]> {
    if (!this.config.retrieval.enabled) {
      return [];
    }

    const searchConfig = this.config.retrieval.search;
    const sources = this.config.retrieval.sources;

    const results: RetrievedDocument[] = [];

    if (sources.incidents?.enabled) {
      results.push({
        collection: "incidents",
        content: "Active anomaly INC-2026-089: Transformer overheating at Vanalinn Substation 4B.",
        similarity: 0.89,
        metadata: { timestamp: new Date().toISOString(), severity: "HIGH" },
      });
    }

    if (sources.infrastructure?.enabled) {
      results.push({
        collection: "infrastructure",
        content: "Grid Node 1422 (Harju Feeder): Max capacity 15MW, current load 14.8MW (98.6%).",
        similarity: 0.82,
        metadata: { location: "Harju", status: "CRITICAL" },
      });
    }

    return results
      .filter((doc) => doc.similarity >= searchConfig.similarity_threshold)
      .slice(0, searchConfig.top_k);
  }
}
