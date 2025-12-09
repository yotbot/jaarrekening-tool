import { NextResponse } from "next/server";
import { embedManyValues } from "@/lib/embed";
import { findRelevantPages } from "@/lib/findRelevantPages";

export async function GET() {
  // Example PDF pages
  const pages = [
    { page: 1, text: "De balans toont activa en passiva over 2023." },
    {
      page: 2,
      text: "De accountant geeft zijn controleverklaring hieronder...",
    },
    { page: 3, text: "Toelichting op de rechtmatigheidsverantwoording." },
  ];

  // Embed the pages
  const embeddings = await embedManyValues(pages.map((p) => p.text));
  const pagesWithEmbeddings = pages.map((p, i) => ({
    ...p,
    embedding: embeddings[i],
  }));

  const vraag = "Waar staat de controleverklaring van de accountant?";
  const subvragen = [
    "reikwijdte van het onderzoek",
    "oordeel over vereiste inzicht",
    "verenigbaarheid met bestuursverslag",
  ];

  const relevantPages = await findRelevantPages(
    vraag,
    subvragen,
    pagesWithEmbeddings,
    2
  );

  return NextResponse.json({
    vraag,
    subvragen,
    relevantPages,
  });
}
