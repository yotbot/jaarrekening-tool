"use client";

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
    return <p>Bezig met analyseren…</p>;
  }

  if (!results || results.length === 0) {
    return <p>Geen resultaten beschikbaar.</p>;
  }

  return (
    <div className="space-y-6">
      {results.map((r, idx) => {
        const analyse = r.analyse;
        const gevonden = analyse?.gevonden ?? false;
        const score = analyse?.score ?? 0;
        const pagina = analyse?.pagina ?? null;
        const uitleg =
          analyse?.uitleg ??
          "Geen nadere uitleg beschikbaar (analyse ontbreekt of faalde).";

        return (
          <div
            key={idx}
            className={`p-4 rounded-xl border shadow-sm ${
              r.analyse?.gevonden
                ? "border-green-400 bg-green-50"
                : "border-red-400 bg-red-50"
            }`}
          >
            <p className="font-semibold text-gray-900">{r.vraag}</p>

            {r.subvragen && r.subvragen?.length > 0 && (
              <ul className="ml-6 mt-1 list-disc text-gray-700 text-sm">
                {r.subvragen?.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}

            <p className="text-sm mt-2">
              <b>Score:</b> {r.analyse?.score} — <b>Pagina:</b>{" "}
              {r.analyse?.pagina ?? "—"}
            </p>

            <p className="text-sm text-gray-700 mt-1">{r.analyse?.uitleg}</p>
          </div>
        );
      })}
    </div>
  );
}
