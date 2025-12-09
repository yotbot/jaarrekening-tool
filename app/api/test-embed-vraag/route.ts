import { NextResponse } from "next/server";
import { embedChecklistVraag } from "@/lib/embedChecklistVraag";

export async function GET() {
  const vraag = "Waar staat de controleverklaring?";
  const subvragen = [
    "vermelding waar onderzoek op ziet",
    "reikwijdte van de controle",
    "vereiste inzicht",
    "verenigbaarheid bestuursverslag",
  ];

  const vec = await embedChecklistVraag(vraag, subvragen);

  return NextResponse.json({
    dim: vec.length,
    sample: vec.slice(0, 10),
  });
}
