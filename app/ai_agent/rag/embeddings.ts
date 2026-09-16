import { normalizeVector } from "../vector_db/similarity";

export interface IEmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/**
 * Deterministic fast embedding generator for offline/local resilience.
 * Produces a normalized 64-dimensional semantic dense vector.
 */
export class DeterministicLocalEmbedder implements IEmbeddingProvider {
  private readonly dimensions = 64;

  async embed(text: string): Promise<number[]> {
    const vector = new Array<number>(this.dimensions).fill(0);
    const tokens = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1);

    if (tokens.length === 0) {
      return normalizeVector(new Array<number>(this.dimensions).fill(0.01));
    }

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let hash = 0;
      for (let j = 0; j < token.length; j++) {
        hash = (hash * 31 + token.charCodeAt(j)) >>> 0;
      }
      const dimIndex = hash % this.dimensions;
      const weight = 1.0 + (token.length > 5 ? 0.5 : 0);
      vector[dimIndex] += weight;
    }

    return normalizeVector(vector);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}

export const defaultEmbedder: IEmbeddingProvider = new DeterministicLocalEmbedder();
