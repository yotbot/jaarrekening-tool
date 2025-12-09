import { NextRequest, NextResponse } from "next/server";
import { saveKB } from "@/lib/kb";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();

    if (!json.items || !Array.isArray(json.items)) {
      return NextResponse.json(
        { error: "Missing items array in body" },
        { status: 400 }
      );
    }

    await saveKB(json.items);

    return NextResponse.json({
      ok: true,
      message: `Saved ${json.items.length} checklist items`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to save KB", details: err.message },
      { status: 500 }
    );
  }
}
