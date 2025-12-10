"use client";

export default function ResultsList({
  results,
  loading,
}: {
  results: any[];
  loading: boolean;
}) {
  if (loading) return <p>Bezig met analyseren…</p>;
  if (!results.length) return <p>Geen resultaten beschikbaar.</p>;

  return (
    <div className="space-y-6">
      {results.map((item, idx) => (
        <div key={idx} className="border rounded-lg p-4 bg-gray-50 space-y-2">
          <p className="font-semibold text-gray-900">{item.vraag}</p>

          {/* Subvragen */}
          {item.subvragen?.length > 0 && (
            <details className="ml-4">
              <summary className="cursor-pointer">Subvragen</summary>
              <ul className="ml-6 list-disc text-sm">
                {item.subvragen.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </details>
          )}

          {/* Relevant pages */}
          <div>
            <p className="text-sm font-medium text-gray-700">
              Relevante pagina's:
            </p>
            <ul className="ml-6 list-disc text-sm">
              {item.relevantPages.map((rp: any, i: number) => (
                <li key={i}>
                  Pagina {rp.page} — score {rp.score.toFixed(3)}
                </li>
              ))}
            </ul>
          </div>

          {/* Analyse */}
          <div
            className={`p-3 rounded ${
              item.analyse.gevonden ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <p className="text-sm font-semibold">
              {item.analyse.gevonden
                ? "✔ Voorwaarde gevonden"
                : "✘ Voorwaarde NIET gevonden"}
            </p>
            <p className="text-xs">
              Pagina: {item.analyse.pagina ?? "—"} | Score: {item.analyse.score}
            </p>
            <p className="text-xs mt-1 text-gray-700">{item.analyse.uitleg}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
