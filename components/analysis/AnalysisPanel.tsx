"use client";

import { useState } from "react";
import ResultsList from "./ResultsList";
import ScoreDonut from "../ScoreDonut";
import { AnalyseResult } from "@/app/api/analyse/stream/route";
import AnalysisHeader from "./AnalysisHeader";
import FilterBar from "../FilterBar";

export default function AnalysisPanel({
  pdfId,
  checklistId,
  sheetNames,
}: {
  pdfId: string;
  checklistId: string;
  sheetNames: string[];
}) {
  const [selectedSheet, setSelectedSheet] = useState(sheetNames[0] ?? "");
  const [filter, setFilter] = useState<"all" | "found" | "notfound">("all");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalyseResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("Idle");

  // --------------------------------------------------
  // Analyse starten
  // --------------------------------------------------
  const startAnalyse = (maxItems: number | null) => {
    setLoading(true);
    setResults([]);
    setProgress(0);
    setStatusMessage("Analyse gestart…");

    const maxItemsParam = maxItems === null ? "" : `&maxItems=${maxItems}`;

    const url = `/api/analyse/stream?pdfId=${pdfId}&checklistId=${checklistId}&sheet=${encodeURIComponent(
      selectedSheet
    )}${maxItemsParam}`;

    const evt = new EventSource(url);

    evt.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.type === "progress") {
        if (typeof data.percent === "number") setProgress(data.percent);
        if (data.message) setStatusMessage(data.message);
      }

      if (data.type === "partial") {
        setResults(data.results);
      }

      if (data.type === "done") {
        setResults(data.results);
        setProgress(100);
        setStatusMessage("Analyse voltooid");
        setLoading(false);
        evt.close();
      }

      if (data.type === "error") {
        setStatusMessage("Fout: " + data.message);
        setLoading(false);
        evt.close();
      }
    };

    evt.onerror = () => {
      setStatusMessage("Verbinding verbroken");
      setLoading(false);
      evt.close();
    };
  };

  // --------------------------------------------------
  // Donut stats
  // --------------------------------------------------
  const getSheetStats = (results: AnalyseResult[]) => {
    if (!results.length)
      return { total: 0, found: 0, notFound: 0, avgScore: 0, percent: 0 };

    const total = results.length;
    const found = results.filter((r) => r.analyse?.gevonden).length;
    const notFound = total - found;
    const avgScore =
      results.reduce((s, r) => s + (r.analyse?.score ?? 0), 0) / total;

    return {
      total,
      found,
      notFound,
      avgScore: Number(avgScore.toFixed(2)),
      percent: Math.round((found / total) * 100),
    };
  };

  // --------------------------------------------------
  // Filtering
  // --------------------------------------------------
  const filteredResults =
    filter === "all"
      ? results
      : results.filter((r) =>
          filter === "found" ? r.analyse?.gevonden : !r.analyse?.gevonden
        );

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-8">
      <AnalysisHeader
        pdfId={pdfId}
        checklistId={checklistId}
        sheet={selectedSheet}
      />

      {/* SHEET + ACTION BUTTONS */}
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Sheet</label>
          <select
            value={selectedSheet}
            onChange={(e) => setSelectedSheet(e.target.value)}
            className="border p-2 rounded bg-white"
          >
            {sheetNames.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => startAnalyse(5)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            {loading ? "…" : "Analyse eerste 5 checks"}
          </button>

          <button
            onClick={() => startAnalyse(null)}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400"
          >
            {loading ? "…" : "Volledige analyse"}
          </button>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="space-y-2">
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-3 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-600">{statusMessage}</p>
      </div>

      {/* SCORE OVERVIEW */}
      {results.length > 0 && (
        <div className="p-6 bg-gray-50 border rounded-xl space-y-4">
          <h3 className="text-lg font-semibold">
            Overzicht score voor: {selectedSheet}
          </h3>

          {(() => {
            const stats = getSheetStats(results);

            return (
              <div className="flex items-center gap-12">
                <ScoreDonut
                  found={stats.found}
                  notFound={stats.notFound}
                  percent={stats.percent}
                />

                <div className="space-y-1 text-gray-700">
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

      {/* FILTERS */}
      <FilterBar filter={filter} setFilter={setFilter} />

      {/* RESULT LIST */}
      <ResultsList results={filteredResults} loading={loading} />
    </div>
  );
}
