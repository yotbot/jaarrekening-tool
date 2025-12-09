// lib/embed.ts
import { voyage } from "voyage-ai-provider";
import { embedMany } from "ai";

if (!process.env.VOYAGE_API_KEY) {
  throw new Error("Missing VOYAGE_API_KEY");
}

// CORRECT: model + provider config passed TOGETHER
const embeddingModel = voyage.textEmbeddingModel("voyage-3-lite");

export async function embedManyValues(values: string[]): Promise<number[][]> {
  if (!values.length) return [];

  const { embeddings } = await embedMany({
    model: embeddingModel, // Fully typed model
    values,
  });

  return embeddings;
}

export async function embedOne(value: string): Promise<number[]> {
  const [vector] = await embedManyValues([value]);
  return vector;
}
