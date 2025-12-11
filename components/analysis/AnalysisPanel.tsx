"use client";

import { useState } from "react";
import ResultsList from "./ResultsList";
import ScoreDonut from "../ScoreDonut";
import { AnalyseResult } from "@/app/api/analyse/stream/route";

export default function AnalysisPanel({
  pdfId,
  checklistId,
  sheetNames,
}: {
  pdfId: string;
  checklistId: string;
  sheetNames: string[];
}) {
  const [selectedSheet, setSelectedSheet] = useState(sheetNames[0] || "");
  const [filter, setFilter] = useState<"all" | "found" | "notfound">("all");
  const [maxItems, setMaxItems] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>("Idle");

  const handleAnalyse = () => {
    setResults([]);
    setStatusMessage("Analyse gestart…");
    setProgress(0);

    const url = `/api/analyse/stream?pdfId=${pdfId}&checklistId=${checklistId}&sheet=${encodeURIComponent(
      selectedSheet
    )}&maxItems=${maxItems}`;
    console.log("Starting analysis with URL:", url);

    const evt = new EventSource(url);

    evt.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "progress") {
        setStatusMessage(data.message);
        if (typeof data.percent === "number") setProgress(data.percent);
      }

      if (data.type === "partial") {
        setResults(data.results);
      }

      if (data.type === "done") {
        setResults(data.results);
        setStatusMessage("Analyse voltooid");
        setProgress(100);
        evt.close();
      }

      if (data.type === "error") {
        setStatusMessage("Fout: " + data.message);
        evt.close();
      }
    };

    evt.onerror = () => {
      setStatusMessage("Verbinding verbroken");
      evt.close();
    };
  };

  function getSheetStats(results: AnalyseResult[]) {
    const total = results.length;
    const found = results.filter((r) => r.analyse?.gevonden).length;
    const notFound = total - found;

    const avgScore =
      results.reduce((sum, r) => sum + (r.analyse?.score || 0), 0) / total;

    return {
      total,
      found,
      notFound,
      avgScore: Number(avgScore.toFixed(2)),
      percent: Math.round((found / total) * 100),
    };
  }

  const filteredResults =
    filter === "all"
      ? results
      : results.filter((r) =>
          filter === "found" ? r.analyse.gevonden : !r.analyse.gevonden
        );

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-6">
      <h2 className="text-xl font-semibold">Analyse</h2>

      <div className="flex gap-4 items-end">
        <div>
          <label className="text-sm">Sheet</label>
          <select
            className="border p-2 rounded bg-white"
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
          >
            {sheetNames.map((s) => (
              <option value={s} key={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm">Aantal items</label>
          <input
            type="number"
            className="border p-2 rounded w-20"
            value={maxItems}
            onChange={(e) => setMaxItems(Number(e.target.value))}
          />
        </div>

        <button
          onClick={handleAnalyse}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          {loading ? "Analyseren..." : "Start analyse"}
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4">
        <label>Filter:</label>
        <select
          className="border p-2 rounded bg-white"
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
        >
          <option value="all">Alles</option>
          <option value="found">Gevonden</option>
          <option value="notfound">Niet gevonden</option>
        </select>
      </div>

      <div className="space-y-2">
        <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-3 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-gray-600">{statusMessage}</p>
      </div>

      {/* RESULTS */}
      {results && (
        <div className="mt-8 p-6 bg-white rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-4">
            Overzicht score voor: {selectedSheet}
          </h3>

          {(() => {
            const stats = getSheetStats(results);
            return (
              <div className="flex items-center gap-10">
                <ScoreDonut
                  found={stats.found}
                  notFound={stats.notFound}
                  percent={stats.percent}
                />

                <div className="space-y-2 text-gray-700">
                  <p>
                    <b>Totaal items:</b> {stats.total}
                  </p>
                  <p>
                    <b>Gevonden:</b> {stats.found}
                  </p>
                  <p>
                    <b>Niet gevonden:</b> {stats.notFound}
                  </p>
                  <p>
                    <b>Gem. score:</b> {stats.avgScore}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}
      <ResultsList results={filteredResults} loading={loading} />
    </div>
  );
}
