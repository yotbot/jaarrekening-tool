export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { pdfToText } from "@/lib/pdfToText";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await pdfToText(buffer);

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("PDF ERROR:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF", details: err.message },
      { status: 500 }
    );
  }
}
