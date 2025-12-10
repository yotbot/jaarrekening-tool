"use client";

import { useState } from "react";
import ResultsList from "./ResultsList";

export default function AnalysisPanel({
  pdfId,
  sheetNames,
}: {
  pdfId: string;
  sheetNames: string[];
}) {
  const [selectedSheet, setSelectedSheet] = useState(sheetNames[0] || "");
  const [filter, setFilter] = useState<"all" | "found" | "notfound">("all");
  const [maxItems, setMaxItems] = useState(10);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleAnalyse = async () => {
    setLoading(true);
    setResults([]);

    const res = await fetch("/api/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdfId, sheet: selectedSheet, maxItems }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.ok) {
      alert("Analyse mislukt");
      return;
    }

    setResults(data.results);
  };

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

      {/* RESULTS */}
      <ResultsList results={filteredResults} loading={loading} />
    </div>
  );
}
