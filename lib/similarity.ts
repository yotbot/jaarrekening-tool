// lib/similarity.ts
// Cosine similarity for RAG page/vraag matching

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Cosine similarity error: vectors have different lengths (${a.length} vs ${b.length})`
    );
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;

  return dot / denom;
}

//
// Helper to score multiple pages at once
//
export function rankBySimilarity(
  queryVector: number[],
  pageVectors: { page: number; embedding: number[] }[]
) {
  return pageVectors
    .map((p) => ({
      page: p.page,
      score: cosineSimilarity(queryVector, p.embedding),
    }))
    .sort((a, b) => b.score - a.score);
}
