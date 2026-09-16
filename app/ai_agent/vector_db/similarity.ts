import { z } from "zod";

export const VectorSchema = z.array(z.number());
export type Vector = z.infer<typeof VectorSchema>;

/**
 * Calculates dot product of two vectors
 */
export function dotProduct(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Calculates Euclidean norm of a vector
 */
export function vectorNorm(v: number[]): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes vector to unit length
 */
export function normalizeVector(v: number[]): number[] {
  const norm = vectorNorm(v);
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

/**
 * Computes Cosine Similarity between two vectors [-1.0, 1.0]
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  const normA = vectorNorm(a);
  const normB = vectorNorm(b);
  if (normA === 0 || normB === 0) return 0;
  return dotProduct(a, b) / (normA * normB);
}
