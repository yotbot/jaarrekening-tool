// lib/findRelevantPages.ts

export type PageChunk = {
  page: number;
  text: string;
};

export type RelevantPage = {
  page: number;
  score: number;
  text: string;
};

export function extractKeywords(question: string): string[] {
  return question
    .toLowerCase()
    .split(/[^a-zA-Z0-9]+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}

const STOPWORDS = new Set([
  "de",
  "het",
  "een",
  "dat",
  "die",
  "voor",
  "van",
  "den",
  "met",
  "naar",
  "aan",
  "als",
  "bij",
  "niet",
  "wordt",
  "moet",
  "heeft",
  "hebben",
  "volgens",
  "rekening",
  "jaarrekening",
  "balans",
  "toelichting",
]);

export function findRelevantPages(
  question: string,
  pages: PageChunk[],
  maxResults: number = 3
): RelevantPage[] {
  const keywords = extractKeywords(question);

  const scored = pages
    .map((p) => {
      let score = 0;
      const lower = p.text.toLowerCase();

      for (const kw of keywords) {
        if (lower.includes(kw)) score += 1;
      }

      return {
        page: p.page,
        text: p.text,
        score,
      };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxResults);
}
