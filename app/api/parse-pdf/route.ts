export const runtime = "nodejs"; // BELANGRIJK

import { NextRequest, NextResponse } from "next/server";
import { pdfToPages } from "@/lib/pdfToPages";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pages = await pdfToPages(buffer);

    return NextResponse.json({
      totalPages: pages.length,
      pages: pages,
    });
  } catch (err: any) {
    console.error("PDF ERROR:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF", details: err.message },
      { status: 500 }
    );
  }
}
