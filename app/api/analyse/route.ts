// app/api/analyse/route.ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { findRelevantPages } from "@/lib/findRelevantPages";
import { groq, DEFAULT_MODEL } from "@/lib/aiClient";

export const runtime = "nodejs";

// ===== configure batch size here =====
// 5–10 is ideaal voor Groq free tier
const BATCH_SIZE = 4;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pdfId = body.pdfId;
    const sheet = body.sheet;
    const maxItems: number = body.maxItems ?? 20;

    if (!pdfId || !sheet) {
      return NextResponse.json(
        { ok: false, error: "Missing pdfId or sheet" },
        { status: 400 }
      );
    }

    console.log("🔍 Starting batched analysis:", { pdfId, sheet });

    // 1. Load PDF pages with embeddings
    const pages = await kv.get(`pdf:${pdfId}:pages`);
    if (!pages || !Array.isArray(pages)) {
      return NextResponse.json(
        { ok: false, error: "PDF not found in KV" },
        { status: 400 }
      );
    }

    // 2. Load checklist
    const checklist = await kv.get("kb:checklist");
    if (!checklist || !Array.isArray(checklist)) {
      return NextResponse.json(
        { ok: false, error: "Checklist not found" },
        { status: 500 }
      );
    }

    // 3. Filter on sheet
    const filtered = checklist.filter((item) => item.sheet === sheet);
    const itemsToAnalyse = filtered.slice(0, maxItems);

    console.log(
      `📋 ${itemsToAnalyse.length} vragen in analyse voor sheet "${sheet}"`
    );

    // 4. Compute relevant pages PER vraag (RAG)
    //    (embedding already precomputed by findRelevantPages)
    const ragBundles = [];
    for (const item of itemsToAnalyse) {
      const vraag = item.vraag;
      const subvragen = item.subvragen ?? [];

      const relevantPages = await findRelevantPages(vraag, subvragen, pages, 3);

      // context for LLM
      let contextText = "";
      for (const rp of relevantPages) {
        const pg = pages.find((p) => p.page === rp.page);
        if (pg) {
          contextText += `\n\n--- Page ${pg.page} (score ${rp.score.toFixed(
            3
          )}) ---\n${pg.text}`;
        }
      }

      ragBundles.push({
        vraag,
        subvragen,
        relevantPages,
        contextText,
      });
    }

    // 5. Batch the bundles into groups of BATCH_SIZE
    const batches = [];
    for (let i = 0; i < ragBundles.length; i += BATCH_SIZE) {
      batches.push(ragBundles.slice(i, i + BATCH_SIZE));
    }

    const finalResults = [];

    // 6. Process each batch with ONE LLM call
    for (const batch of batches) {
      console.log(`🧠 Running LLM batch of size ${batch.length}`);

      const batchPrompt = `
Je krijgt ${
        batch.length
      } checklistvragen met bijbehorende context uit de jaarrekening.

⚠️ BELANGRIJKE INSTRUCTIES — LEES ZE GOED:
- Je MOET één JSON ARRAY teruggeven.
- De JSON ARRAY MOET exact ${batch.length} elementen bevatten.
- ELK element MOET het volgende schema gebruiken:

{
  "vraag": string,
  "gevonden": boolean,
  "score": number,
  "pagina": number | null,
  "uitleg": string
}

- De VOLGORDE van de resultaten MOET precies overeenkomen met de volgorde waarin de vragen hieronder staan.
- JE MAG GEEN TEKST toevoegen buiten de JSON array.
- GEEN uitleg, GEEN markdown, GEEN backticks.
- ALLEEN de JSON ARRAY.

---------------------
HIER ZIJN DE VRAGEN
---------------------

${batch
  .map((b, i) => {
    const subs = b.subvragen.length
      ? "\nSubvragen:\n" + b.subvragen.map((s: any) => "- " + s).join("\n")
      : "";

    return `
### VRAAG ${i + 1}
${b.vraag}
${subs}

Context (relevante pagina's):
${b.contextText}
`;
  })
  .join("\n\n")}
`;

      let batchResult: any[] = [];

      try {
        const completion = await groq.chat.completions.create({
          model: DEFAULT_MODEL,
          temperature: 0,
          max_completion_tokens: 2048,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Je bent een AI die Nederlandse jaarrekeningen analyseert. Geef ALTIJD geldige JSON.",
            },
            { role: "user", content: batchPrompt },
          ],
        });

        const raw = completion.choices[0].message.content;
        batchResult = JSON.parse(raw || "");

        // sanity check
        if (!Array.isArray(batchResult)) {
          console.warn("LLM returned non-array, wrapping in array");
          batchResult = [batchResult];
        }

        // Merge results back with RAG info
        for (let i = 0; i < batch.length; i++) {
          finalResults.push({
            vraag: batch[i].vraag,
            subvragen: batch[i].subvragen,
            relevantPages: batch[i].relevantPages,
            analyse: batchResult[i] ?? {
              gevonden: false,
              score: 0,
              pagina: null,
              uitleg: "No JSON returned for this item",
            },
          });
        }
      } catch (err) {
        console.error("❌ LLM batch error:", err);

        // fallback for whole batch
        for (const b of batch) {
          finalResults.push({
            vraag: b.vraag,
            subvragen: b.subvragen,
            relevantPages: b.relevantPages,
            analyse: {
              gevonden: false,
              score: 0,
              pagina: null,
              uitleg: "LLM error",
            },
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      pdfId,
      sheet,
      analysedItems: finalResults.length,
      results: finalResults,
    });
  } catch (err: any) {
    console.error("❌ analysis error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
