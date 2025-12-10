// app/api/analyse/route.ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { findRelevantPages } from "@/lib/findRelevantPages";
import { embedChecklistVraag } from "@/lib/embedChecklistVraag";
import { groq, DEFAULT_MODEL } from "@/lib/aiClient";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const pdfId: string = body.pdfId;
    const sheet: string | undefined = body.sheet;
    const maxItems: number = body.maxItems ?? 10;

    if (!pdfId) {
      return NextResponse.json(
        { ok: false, error: "Missing pdfId" },
        { status: 400 }
      );
    }

    console.log("🔍 Analyse start:", { pdfId, sheet });

    // 1. PDF embeddings ophalen
    const pages = await kv.get(`pdf:${pdfId}:pages`);
    if (!pages || !Array.isArray(pages)) {
      return NextResponse.json(
        { ok: false, error: "PDF not found in KV" },
        { status: 400 }
      );
    }

    // 2. Checklist ophalen
    const checklist = await kv.get("kb:checklist");
    if (!checklist || !Array.isArray(checklist)) {
      return NextResponse.json(
        { ok: false, error: "Checklist not found" },
        { status: 500 }
      );
    }

    // 3. Filteren op sheet (wizard selectie)
    const filteredChecklist = sheet
      ? checklist.filter((item: any) => item.sheet === sheet)
      : checklist;

    if (filteredChecklist.length === 0) {
      return NextResponse.json(
        { ok: false, error: `No checklist items found for sheet "${sheet}"` },
        { status: 400 }
      );
    }

    console.log(
      `📋 ${filteredChecklist.length} checklist vragen gevonden voor sheet "${sheet}"`
    );

    // 4. Beperk items (voor snel testen)
    const itemsToAnalyse = filteredChecklist.slice(0, maxItems);

    const results = [];

    for (const item of itemsToAnalyse) {
      const vraag = item.vraag;
      const subvragen = item.subvragen ?? [];

      // RAG retrieval
      const relevantPages = await findRelevantPages(vraag, subvragen, pages, 3);

      // Tekst verzamelen voor LLM
      let contextText = "";
      for (const rp of relevantPages) {
        const pg = pages.find((p) => p.page === rp.page);
        if (pg) {
          contextText += `\n\n--- Page ${pg.page} ---\n${pg.text}`;
        }
      }

      const prompt = `
Analyseer deze checklistvraag op basis van de relevante PDF-pagina(’s).

Vraag:
${vraag}

Subvragen:
${subvragen.length ? subvragen.map((s: string) => "- " + s).join("\n") : "Geen"}

Pagina's:
${contextText}

Geef strikt geldige JSON terug:
{
  "gevonden": boolean,
  "score": number,
  "pagina": number | null,
  "uitleg": string
}
`;

      let analyseResult = {
        gevonden: false,
        score: 0,
        pagina: null,
        uitleg: "Model returned no valid JSON",
      };

      try {
        const completion = await groq.chat.completions.create({
          model: DEFAULT_MODEL,
          temperature: 0,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Analyseer volgens Nederlandse accountancy- en jaarrekeningregels. Geef ALTIJD geldige JSON.",
            },
            { role: "user", content: prompt },
          ],
        });

        analyseResult = JSON.parse(completion.choices[0].message.content || "");
      } catch (err) {
        console.error("LLM error", err);
      }

      results.push({
        sheet: item.sheet,
        vraag,
        subvragen,
        relevantPages,
        analyse: analyseResult,
      });
    }

    return NextResponse.json({
      ok: true,
      pdfId,
      sheet,
      analysedItems: results.length,
      results,
    });
  } catch (err: any) {
    console.error("❌ Analyse error:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
