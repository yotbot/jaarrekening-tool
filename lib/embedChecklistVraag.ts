// lib/embedChecklistVraag.ts
// Combine vraag + subvragen into a single semantic embedding for RAG retrieval

import { embedOne } from "@/lib/embed";

export async function embedChecklistVraag(
  vraag: string,
  subvragen?: string[]
): Promise<number[]> {
  if (!vraag || !vraag.trim()) return [];

  // Combine vraag + subvragen into one embedding text
  const combined =
    subvragen && subvragen.length > 0
      ? `${vraag}\n\nSubvragen:\n${subvragen.map((s) => "- " + s).join("\n")}`
      : vraag;

  return embedOne(combined);
}
