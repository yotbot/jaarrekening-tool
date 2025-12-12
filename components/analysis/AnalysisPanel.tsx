"use client";

import { useState } from "react";
import ResultsList from "./ResultsList";
import ScoreDonut from "../ScoreDonut";
import { AnalyseResult } from "@/app/api/analyse/stream/route";
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
    <div className="px-3 py-6 md:p-6 bg-white rounded-xl shadow space-y-4 text-foreground">
      <div>
        <dl className="grid gap-6 sm:grid-cols-3 font-mono">
          <div>
            <dd className="text-xs uppercase">PDF</dd>
            <dt className="text-sm">{pdfId}</dt>
          </div>
          <div>
            <dd className="text-xs uppercase">Checklist</dd>
            <dt className="text-sm">{checklistId}</dt>
          </div>
          <div>
            <dd className="text-xs uppercase">Sheet</dd>
            <dt className="text-sm">{selectedSheet}</dt>
          </div>
        </dl>
      </div>

      {/* SHEET + ACTION BUTTONS */}
      <div className="grid sm:grid-cols-3 md:gap-6">
        <div className="flex flex-col">
          <label className="text-sm font-mono mb-1">Sheet</label>
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

        <button
          onClick={() => startAnalyse(5)}
          disabled={loading}
          className="mt-6 px-12 py-6 font-mono uppercase rounded-xl text-sm font-medium border text-foreground bg-background cursor-pointer disabled:border-neutral-3 disabled:text-neutral-3"
        >
          Analyse eerste 5 checks
        </button>

        <button
          onClick={() => startAnalyse(null)}
          disabled={loading}
          className="mt-6 px-12 py-6 font-mono uppercase rounded-xl text-sm font-medium border text-background bg-foreground cursor-pointer disabled:bg-neutral-3"
        >
          Volledige analyse
        </button>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full bg-gray-200 rounded-full h-5 shadow-inner">
        <div
          className="bg-yellow h-5 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm font-sans text-gray-500">{statusMessage}</p>

      {/* SCORE OVERVIEW */}
      {results.length > 0 && (
        <div className="p-6 bg-gray-50 rounded-xl space-y-4 mb-8">
          <h3 className="text-2xl font-sans font-semibold">
            Overzicht score voor: {selectedSheet}
          </h3>

          {(() => {
            const stats = getSheetStats(results);

            return (
              <div className="flex flex-col md:flex-row items-center md:gap-12">
                <ScoreDonut
                  found={stats.found}
                  notFound={stats.notFound}
                  percent={stats.percent}
                />

                <div className="space-y-1 text-gray-700 font-mono">
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
