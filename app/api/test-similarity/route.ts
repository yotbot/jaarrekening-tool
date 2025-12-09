import { NextResponse } from "next/server";
import { embedOne } from "@/lib/embed";
import { cosineSimilarity } from "@/lib/similarity";

export async function GET() {
  // Two similar texts
  const v1 = await embedOne("balans per 31 december 2023");
  const v2 = await embedOne("balans en passiva in de jaarrekening");

  // Two unrelated texts
  const v3 = await embedOne("de accountant geeft een controleverklaring");

  return NextResponse.json({
    sim12: cosineSimilarity(v1, v2), // expected ~0.7 to ~0.9
    sim13: cosineSimilarity(v1, v3), // expected much lower, ~0.1 to ~0.3
  });
}
