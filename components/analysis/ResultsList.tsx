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
      {results.map((item, idx) => {
        const analyse = item.analyse;
        const gevonden = analyse?.gevonden ?? false;
        const score = analyse?.score ?? 0;
        const pagina = analyse?.pagina ?? null;
        const uitleg =
          analyse?.uitleg ??
          "Geen nadere uitleg beschikbaar (analyse ontbreekt of faalde).";

        return (
          <div key={idx} className="border rounded-lg p-4 bg-gray-50 space-y-2">
            <p className="font-semibold text-gray-900">{item.vraag}</p>

            {/* Subvragen */}
            {item.subvragen && item.subvragen.length > 0 && (
              <details className="ml-4">
                <summary className="cursor-pointer text-gray-700 text-sm">
                  Subvragen
                </summary>
                <ul className="mt-1 list-disc ml-5 text-gray-600 text-sm">
                  {item.subvragen.map((sv, i2) => (
                    <li key={i2}>{sv}</li>
                  ))}
                </ul>
              </details>
            )}

            {/* Relevante pagina's */}
            <div>
              <p className="text-sm font-medium text-gray-700">
                Relevante pagina&apos;s:
              </p>
              <ul className="ml-6 list-disc text-gray-600 text-sm">
                {item.relevantPages?.map((rp, i3) => (
                  <li key={i3}>
                    Pagina {rp.page} — score {rp.score.toFixed(3)}
                  </li>
                )) ?? <li>Geen pagina-informatie beschikbaar.</li>}
              </ul>
            </div>

            {/* Analyseblok – veilig met fallbacks */}
            <div
              className={`p-3 rounded ${
                gevonden ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <p className="text-sm font-semibold">
                {analyse
                  ? gevonden
                    ? "✔ Voorwaarde gevonden"
                    : "✘ Voorwaarde niet (duidelijk) gevonden"
                  : "⚠ Geen analysegegevens beschikbaar voor deze vraag"}
              </p>
              <p className="text-xs">
                Pagina: {pagina ?? "—"} | Score: {score}
              </p>
              <p className="text-xs mt-1 text-gray-700">{uitleg}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
