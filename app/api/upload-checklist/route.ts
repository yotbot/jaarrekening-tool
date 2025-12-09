import { NextRequest, NextResponse } from "next/server";
import { parseChecklistExcel } from "@/lib/parseChecklist";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const items = parseChecklistExcel(buffer);

    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to parse checklist", details: err.message },
      { status: 500 }
    );
  }
}
