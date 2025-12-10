// app/api/checklist/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { parseChecklistExcel } from "@/lib/parseChecklistExcel";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          ok: false,
          error: "No file provided. Use form-data with key 'file'.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const { items, sheetNames } = parseChecklistExcel(buffer);

    if (!items.length) {
      return NextResponse.json(
        { ok: false, error: "No checklist items found in Excel." },
        { status: 400 }
      );
    }

    // Checklist in KV opslaan (alle items, met sheet veld)
    await kv.set("kb:checklist", items);

    return NextResponse.json({
      ok: true,
      itemCount: items.length,
      sheetNames,
    });
  } catch (err: any) {
    console.error("❌ /api/checklist/upload error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to parse checklist" },
      { status: 500 }
    );
  }
}
