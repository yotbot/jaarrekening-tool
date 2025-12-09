// app/api/test-embed/route.ts
import { NextResponse } from "next/server";
import { embedOne, embedManyValues } from "@/lib/embed";

export const runtime = "nodejs"; // optional but recommended

export async function GET(req: Request) {
  try {
    // Test single embedding
    const one = await embedOne("balans per 31 december 2023");

    // Test multiple embeddings
    const many = await embedManyValues([
      "controleverklaring",
      "rechtmatigheid",
    ]);

    return NextResponse.json({
      ok: true,
      oneDim: one.length,
      oneSample: one.slice(0, 5),
      manyCount: many.length,
      manyDims: many[0].length,
      manyFirstSample: many[0].slice(0, 5),
    });
  } catch (err: any) {
    console.error("❌ Error in test-embed:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
