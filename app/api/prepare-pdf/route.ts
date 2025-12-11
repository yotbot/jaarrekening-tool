// app/api/prepare-pdf/route.ts
// 1) Upload PDF
// 2) Extract pages
// 3) Embed all pages in batch
// 4) Store them in KV for later analysis

import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { pdfToPages } from "@/lib/pdfToPages";
import { embedManyValues } from "@/lib/embed";
import type { PageEmbedding } from "@/lib/findRelevantPages";
import { auth } from "@clerk/nextjs/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Use form-data with key 'file'." },
        { status: 400 }
      );
    }

    console.log("📄 Received PDF:", file.name);

    // 1. Read PDF buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // 2. Extract pages: [ { page, text } ]
    const pages = await pdfToPages(buffer);

    if (!pages || pages.length === 0) {
      return NextResponse.json(
        { error: "PDF extracted but no pages found." },
        { status: 400 }
      );
    }

    console.log(`📑 PDF contains ${pages.length} pages`);

    // 3. Embed all pages (batch embedding)
    console.log("🧠 Embedding pages...");
    const embeddings = await embedManyValues(pages.map((p) => p.text || ""));

    // 4. Combine into PageEmbedding objects
    const pagesWithEmbeddings: PageEmbedding[] = pages.map((p, i) => ({
      page: p.page,
      text: p.text || "",
      embedding: embeddings[i],
    }));

    // Create a PDF ID for storage
    const pdfId = `pdf_${Date.now()}`;

    // 5. Store in KV
    await kv.set(`pdf:${userId}:${pdfId}:pages`, pagesWithEmbeddings);
    await kv.set(`pdf:${userId}:${pdfId}:meta`, {
      name: file.name,
      uploadedAt: Date.now(),
      pageCount: pages.length,
    });

    console.log(`💾 Stored embedded PDF as: pdf:${pdfId}:pages`);

    return NextResponse.json({
      ok: true,
      pdfId,
      pageCount: pagesWithEmbeddings.length,
    });
  } catch (err: any) {
    console.error("❌ Error in /api/prepare-pdf:", err);
    return NextResponse.json(
      { error: err.message || "Failed to prepare PDF" },
      { status: 500 }
    );
  }
}
