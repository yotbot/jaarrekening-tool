// app/api/checklist/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { parseChecklistExcel } from "@/lib/parseChecklistExcel";
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

    const checklistId = `checklist_${Date.now()}`;

    // Checklist in KV opslaan (alle items, met sheet veld)
    await kv.set(`kb:${userId}:${checklistId}:checklist`, items);
    await kv.set(`kb:${userId}:${checklistId}:meta`, {
      name: file.name,
      uploadedAt: Date.now(),
      sheetCount: sheetNames.length,
    });

    return NextResponse.json({
      ok: true,
      itemCount: items.length,
      sheetNames,
      checklistId,
    });
  } catch (err: any) {
    console.error("❌ /api/checklist/upload error:", err);
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to parse checklist" },
      { status: 500 }
    );
  }
}
