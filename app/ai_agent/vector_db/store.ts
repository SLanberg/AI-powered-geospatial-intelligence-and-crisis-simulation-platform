import { z } from "zod";
import { cosineSimilarity } from "./similarity";

export const VectorRecordSchema = z.object({
  id: z.string(),
  content: z.string(),
  embedding: z.array(z.number()),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type VectorRecord = z.infer<typeof VectorRecordSchema>;

export const VectorQueryOptionsSchema = z.object({
  topK: z.number().min(1).max(50).default(5),
  minSimilarity: z.number().min(-1).max(1).default(0.1),
  filterKey: z.string().optional(),
  filterValue: z.unknown().optional(),
});
export type VectorQueryOptions = z.infer<typeof VectorQueryOptionsSchema>;

export interface VectorSearchResult {
  record: VectorRecord;
  similarity: number;
}

export class VectorStore {
  private records: Map<string, VectorRecord> = new Map();

  /**
   * Insert or update a vector record
   */
  upsert(record: VectorRecord): void {
    const valid = VectorRecordSchema.parse(record);
    this.records.set(valid.id, valid);
  }

  /**
   * Bulk insert records
   */
  upsertMany(records: VectorRecord[]): void {
    for (const record of records) {
      this.upsert(record);
    }
  }

  /**
   * Find most similar records given a query embedding
   */
  query(queryEmbedding: number[], options?: Partial<VectorQueryOptions>): VectorSearchResult[] {
    const opts = VectorQueryOptionsSchema.parse(options ?? {});
    const results: VectorSearchResult[] = [];

    for (const record of this.records.values()) {
      if (opts.filterKey && opts.filterValue !== undefined) {
        if (!record.metadata || record.metadata[opts.filterKey] !== opts.filterValue) {
          continue;
        }
      }

      const similarity = cosineSimilarity(queryEmbedding, record.embedding);
      if (similarity >= opts.minSimilarity) {
        results.push({ record, similarity });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, opts.topK);
  }

  delete(id: string): boolean {
    return this.records.delete(id);
  }

  clear(): void {
    this.records.clear();
  }

  size(): number {
    return this.records.size;
  }
}

export const globalVectorStore = new VectorStore();
