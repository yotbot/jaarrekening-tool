// lib/findRelevantPages.ts
// RAG retrieval: embed (vraag + subvragen) → compare to page embeddings → return top N relevant pages

import { embedChecklistVraag } from "@/lib/embedChecklistVraag";
import { cosineSimilarity } from "@/lib/similarity";

export interface PageEmbedding {
  page: number;
  text: string;
  embedding: number[];
}

export interface RelevantPage {
  page: number;
  score: number;
}

export async function findRelevantPages(
  vraag: string,
  subvragen: string[] | undefined,
  pages: PageEmbedding[],
  topN: number = 3
): Promise<RelevantPage[]> {
  if (!vraag.trim()) return [];

  // 1. Embed vraag + subvragen together (best practice)
  const vraagVector = await embedChecklistVraag(vraag, subvragen);

  // 2. Compute similarity score for every page
  const scored = pages.map((p) => ({
    page: p.page,
    score: cosineSimilarity(vraagVector, p.embedding),
  }));

  // 3. Sort (highest similarity first)
  const ranked = scored.sort((a, b) => b.score - a.score);

  // 4. Select top N most relevant pages
  return ranked.slice(0, topN);
}
