"use client";

import { Check, X } from "lucide-react";

type RelevantPage = {
  page: number;
  score: number;
};

type AnalyseData = {
  gevonden?: boolean;
  score?: number;
  pagina?: number | null;
  uitleg?: string;
};

export type ResultItem = {
  vraag: string;
  subvragen?: string[];
  relevantPages: RelevantPage[];
  analyse?: AnalyseData; // 👈 kan undefined zijn
};

export default function ResultsList({
  results,
  loading,
}: {
  results: ResultItem[];
  loading: boolean;
}) {
  if (loading) {
    return <p className="font-mono">Bezig met analyseren…</p>;
  }

  if (!results || results.length === 0) {
    return <p>Geen resultaten beschikbaar.</p>;
  }

  return (
    <div className="space-y-6">
      {results.map((r, idx) => {
        return (
          <details key={idx} className="border">
            <summary className="relative px-6 py-3 border-b font-semibold text-sm font-sans text-foreground cursor-pointer">
              {r.vraag}
              {r.analyse?.gevonden ? (
                <Check className="absolute bg-green text-white right-1 top-2.5" />
              ) : (
                <X className="absolute bg-orange text-white right-1 top-2.5" />
              )}
            </summary>

            <div className="px-6 py-3">
              {r.subvragen && r.subvragen?.length > 0 && (
                <ul className="ml-6 mb-2 list-disc text-gray-700 text-sm font-sans">
                  {r.subvragen?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}

              <div className="flex gap-6 font-mono text-sm mt-2">
                <span className="bg-neutral-3 px-2 py-1">
                  <b>Score:</b> {r.analyse?.score}
                </span>
                <span className="bg-neutral-3 px-2 py-1">
                  <b>Pagina:</b>
                  {r.analyse?.pagina ?? "—"}
                </span>
              </div>

              <p className="text-sm text-foreground font-sans mt-3">
                <b>Uitleg: </b>
                {r.analyse?.uitleg}
              </p>
            </div>
          </details>
        );
      })}
    </div>
  );
}
