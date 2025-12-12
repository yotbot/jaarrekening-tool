import { NextRequest } from "next/server";
import { kv } from "@vercel/kv";
import { findRelevantPages, PageEmbedding } from "@/lib/findRelevantPages";
import { groq, DEFAULT_MODEL } from "@/lib/aiClient";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";
export const revalidate = 0;

/* ---------- Types ---------- */

export type RelevantPage = {
  page: number;
  score: number;
};

export type PdfPage = {
  page: number;
  text: string;
  embedding?: number[];
};

export type ChecklistItem = {
  sheet: string;
  vraag: string;
  subvragen: string[];
  bron?: string;
};

export type LlmResultItem = {
  vraag?: string;
  gevonden: boolean;
  score: number;
  pagina: number | null;
  uitleg: string;
  bron?: string;
};

export type AnalyseResult = {
  vraag: string;
  subvragen: string[];
  relevantPages: RelevantPage[];
  analyse: LlmResultItem;
  bron?: string;
};

export type RagBundle = {
  vraag: string;
  subvragen: string[];
  relevantPages: RelevantPage[];
  contextText: string;
  bron?: string;
};

export type SseEventPayload =
  | { type: "progress"; message: string; percent?: number }
  | { type: "partial"; results: AnalyseResult[] }
  | { type: "done"; results: AnalyseResult[] }
  | { type: "error"; message: string };

/* ---------- Helpers ---------- */

function sendEvent(
  controller: ReadableStreamDefaultController,
  data: SseEventPayload
) {
  controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
}

const BATCH_SIZE = 5;

/**
 * Probeert de LLM-output om te zetten naar een *pure* array van LlmResultItem.
 * Accepteert o.a.:
 * - [ {...}, {...} ]
 * - { "array": [ ... ] }
 * - { "results": [ ... ] }
 */
function parseLlmArray(raw: string): LlmResultItem[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("JSON parse error on LLM output:", raw);
    return [];
  }

  // CASE 1: Pure array
  if (Array.isArray(parsed)) {
    return parsed as LlmResultItem[];
  }

  // CASE 2: We got an object → find first array inside
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;

    for (const key of Object.keys(obj)) {
      const val = obj[key];

      if (Array.isArray(val)) {
        return val as LlmResultItem[];
      }

      // deeper nested? - optional
      if (val && typeof val === "object") {
        const nested = Object.values(val as Record<string, unknown>).find((v) =>
          Array.isArray(v)
        );

        if (nested && Array.isArray(nested)) {
          return nested as LlmResultItem[];
        }
      }
    }
  }

  // CASE 3: No array found
  console.error("LLM returned JSON without any array:", parsed);
  return [];
}

/* ---------- SSE Route (GET) ---------- */

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);

  const pdfId = searchParams.get("pdfId");
  const checklistId = searchParams.get("checklistId");
  const sheet = searchParams.get("sheet");
  const maxItemsParam = searchParams.get("maxItems");
  const maxItems = maxItemsParam ? Number(maxItemsParam) : null;

  console.log(
    "🚀 Starting analysis stream for pdfId:",
    pdfId,
    "checklistId:",
    checklistId,
    "sheet:",
    sheet
  );

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!pdfId || !sheet) {
          sendEvent(controller, {
            type: "error",
            message: "pdfId en sheet zijn verplicht.",
          });
          controller.close();
          return;
        }

        /* 1) Checklist ophalen */

        sendEvent(controller, {
          type: "progress",
          message: "Checklist ophalen…",
          percent: 2,
        });

        const checklistRaw = await kv.get(
          `kb:${userId}:${checklistId}:checklist`
        );

        if (!Array.isArray(checklistRaw)) {
          sendEvent(controller, {
            type: "error",
            message: "Checklist ontbreekt of heeft ongeldig formaat.",
          });
          controller.close();
          return;
        }

        const checklist = checklistRaw as ChecklistItem[];

        const allItems = checklist.filter((c) => c.sheet === sheet);
        // .slice(0, maxItems);

        const items = maxItems ? allItems.slice(0, maxItems) : allItems;

        if (!items.length) {
          sendEvent(controller, {
            type: "error",
            message: `Geen checklist-items gevonden voor sheet "${sheet}".`,
          });
          controller.close();
          return;
        }

        sendEvent(controller, {
          type: "progress",
          message: `Analyse voorbereiden… (${items.length} vragen)`,
          percent: 5,
        });

        /* 2) PDF-pagina's ophalen */

        const pagesRaw = await kv.get(`pdf:${userId}:${pdfId}:pages`);
        if (!Array.isArray(pagesRaw)) {
          sendEvent(controller, {
            type: "error",
            message: "PDF is niet gevonden of heeft geen pagina-data.",
          });
          controller.close();
          return;
        }

        const pages: PageEmbedding[] = (pagesRaw as PdfPage[])
          .filter((p) => Array.isArray(p.embedding))
          .map((p) => ({
            page: p.page,
            embedding: p.embedding!,
            text: p.text,
          }));

        /* 3) RAG-bundles opbouwen */

        const ragBundles: RagBundle[] = [];

        for (let i = 0; i < items.length; i++) {
          const it = items[i];

          sendEvent(controller, {
            type: "progress",
            message: `Relevante pagina's zoeken (${i + 1}/${items.length})…`,
            percent: 5 + Math.round(((i + 1) / items.length) * 20),
          });

          const relevantPages: RelevantPage[] = await findRelevantPages(
            it.vraag,
            it.subvragen ?? [],
            pages,
            3
          );

          let contextText = "";
          for (const rp of relevantPages) {
            const pageObj = pages.find((p) => p.page === rp.page);
            if (pageObj) {
              contextText += `\n\n--- Pagina ${pageObj.page} ---\n${pageObj.text}`;
            }
          }

          ragBundles.push({
            vraag: it.vraag,
            subvragen: it.subvragen ?? [],
            relevantPages,
            contextText,
            bron: it.bron,
          });
        }

        /* 4) Bundles in batches knippen */

        const batches: RagBundle[][] = [];
        for (let i = 0; i < ragBundles.length; i += BATCH_SIZE) {
          batches.push(ragBundles.slice(i, i + BATCH_SIZE));
        }

        const finalResults: AnalyseResult[] = [];

        /* 5) Elke batch naar de LLM sturen */

        for (let b = 0; b < batches.length; b++) {
          const batch = batches[b];

          sendEvent(controller, {
            type: "progress",
            message: `Batch ${b + 1}/${batches.length} analyseren…`,
            percent: 25 + Math.round(((b + 1) / batches.length) * 70),
          });

          const prompt = `
Je krijgt ${
            batch.length
          } checklistvragen over jaarrekening-controle, plus context uit de relevante pagina's.

Je MOET een JSON-array van ${
            batch.length
          } objecten teruggeven, ZONDER extra tekst eromheen.

Schema per object:
{
  "vraag": string,
  "gevonden": boolean,
  "score": number,
  "pagina": number | null,
  "uitleg": string
}

- "gevonden": true als de jaarrekening duidelijk voldoet aan de eis.
- "score": 0–10 (hoger = sterker bewijs).
- "pagina": de meest relevante pagina, of null als niet duidelijk.
- "uitleg": korte NL uitleg waarom je dit oordeel velt.

HIER ZIJN DE VRAGEN EN CONTEXT:

${batch
  .map((q, i) => {
    const subs =
      q.subvragen && q.subvragen.length
        ? q.subvragen.map((s) => "- " + s).join("\n")
        : "";
    return `
### VRAAG ${i + 1}
${q.vraag}
${subs ? "Subvragen:\n" + subs : ""}

Context uit het jaarverslag:
${q.contextText}
`;
  })
  .join("\n")}
`;

          const completion = await groq.chat.completions.create({
            model: DEFAULT_MODEL,
            temperature: 0,
            max_completion_tokens: 2048,
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
          });

          let raw = completion.choices[0]?.message?.content || "[]";

          // Probeer JSON-array te extraheren (ook bij { "array": [...] })
          const batchResult = parseLlmArray(raw);

          if (!Array.isArray(batchResult) || batchResult.length === 0) {
            console.warn(
              "LLM gaf geen bruikbare array terug, fallback actief."
            );
          }

          batch.forEach((q, i) => {
            const llmItem = batchResult[i];

            const analyse: LlmResultItem = llmItem
              ? {
                  gevonden: !!llmItem.gevonden,
                  score: typeof llmItem.score === "number" ? llmItem.score : 0,
                  pagina:
                    typeof llmItem.pagina === "number" ||
                    llmItem.pagina === null
                      ? llmItem.pagina
                      : null,
                  uitleg:
                    typeof llmItem.uitleg === "string"
                      ? llmItem.uitleg
                      : "Analyse ontbreekt of model-output had een ongeldig formaat.",
                  vraag: llmItem.vraag ?? q.vraag,
                  bron: q.bron,
                }
              : {
                  gevonden: false,
                  score: 0,
                  pagina: null,
                  uitleg:
                    "Analyse ontbreekt of model-output was leeg voor deze vraag.",
                  vraag: q.vraag,
                  bron: q.bron,
                };

            finalResults.push({
              vraag: q.vraag,
              subvragen: q.subvragen,
              relevantPages: q.relevantPages,
              analyse,
              bron: q.bron,
            });
          });

          // stream actuele verzameling resultaten naar de client
          sendEvent(controller, {
            type: "partial",
            results: finalResults,
          });
        }

        /* 6) Klaar */

        sendEvent(controller, {
          type: "done",
          results: finalResults,
        });
        controller.close();
      } catch (err) {
        console.error("SSE analyse error:", err);
        sendEvent(controller, {
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Onbekende fout tijdens analyse.",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
