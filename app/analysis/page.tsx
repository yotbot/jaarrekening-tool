"use client";

import { useState } from "react";

type AnalyseResult = {
  vraag: string;
  subvragen?: string[];
  relevantPages: { page: number; score: number }[];
  analyse: {
    gevonden: boolean;
    score: number;
    pagina: number | null;
    uitleg: string;
  };
};

export default function AnalysisWizardPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: PDF upload
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfId, setPdfId] = useState<string | null>(null);
  const [loadingPrepare, setLoadingPrepare] = useState(false);

  // Step 2: Checklist upload
  const [checklistFile, setChecklistFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  // Step 3: Sheet keuze
  const [selectedSheet, setSelectedSheet] = useState<string>("");

  // Step 4: Analyse
  const [maxItems, setMaxItems] = useState(5);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [results, setResults] = useState<AnalyseResult[] | null>(null);

  // Helpers voor stappen
  const canGoNextFromStep1 = !!pdfId;
  const canGoNextFromStep2 = sheetNames.length > 0;
  const canGoNextFromStep3 = !!selectedSheet;

  // STEP 1: PDF voorbereiden
  const handlePreparePdf = async () => {
    if (!pdfFile) {
      alert("Upload eerst een jaarrekening PDF.");
      return;
    }

    setLoadingPrepare(true);
    const form = new FormData();
    form.append("file", pdfFile);

    try {
      const res = await fetch("/api/prepare-pdf", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error("prepare-pdf error:", data);
        alert("Fout bij verwerken van PDF.");
      } else {
        setPdfId(data.pdfId);
      }
    } catch (err) {
      console.error(err);
      alert("Netwerkfout bij /api/prepare-pdf");
    } finally {
      setLoadingPrepare(false);
    }
  };

  // STEP 2: Checklist upload
  const handleUploadChecklist = async () => {
    if (!checklistFile) {
      alert("Upload eerst een checklist bestand (bijv. Excel of JSON).");
      return;
    }

    setLoadingChecklist(true);
    const form = new FormData();
    form.append("file", checklistFile);

    try {
      const res = await fetch("/api/checklist/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error("checklist/upload error:", data);
        alert("Fout bij uploaden van checklist.");
      } else {
        // Verwacht: { ok: true, sheetNames: string[] }
        setSheetNames(data.sheetNames || []);
        if ((data.sheetNames || []).length === 1) {
          setSelectedSheet(data.sheetNames[0]);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Netwerkfout bij /api/checklist/upload");
    } finally {
      setLoadingChecklist(false);
    }
  };

  // STEP 4: Analyse uitvoeren
  const handleAnalyse = async () => {
    if (!pdfId || !selectedSheet) {
      alert("PDF en sheet moeten gekozen zijn.");
      return;
    }

    setLoadingAnalysis(true);
    setResults(null);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfId,
          sheet: selectedSheet,
          maxItems,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error("analyse error:", data);
        alert("Fout bij analyse.");
      } else {
        setResults(data.results || []);
      }
    } catch (err) {
      console.error(err);
      alert("Netwerkfout bij /api/analyse");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // UI helpers
  const StepIndicator = () => (
    <div className="flex items-center gap-4 mb-8">
      {[
        { n: 1, label: "Jaarrekening uploaden" },
        { n: 2, label: "Checklist toevoegen" },
        { n: 3, label: "Sheet kiezen" },
        { n: 4, label: "Rapport bekijken" },
      ].map((s) => (
        <div key={s.n} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${
                step === s.n
                  ? "bg-blue-600 text-white"
                  : step > s.n
                  ? "bg-green-500 text-white"
                  : "bg-gray-300 text-gray-700"
              }`}
          >
            {s.n}
          </div>
          <span
            className={`text-sm ${
              step === s.n ? "font-semibold" : "text-gray-600"
            }`}
          >
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Jaarrekening Wizard</h1>
      <p className="text-gray-600">
        Doorloop stap voor stap: jaarrekening uploaden, checklist toevoegen, een
        sheet selecteren en het rapport bekijken.
      </p>

      <StepIndicator />

      {/* STEP CONTENT */}
      {step === 1 && (
        <div className="p-6 bg-white rounded-xl shadow border space-y-4">
          <h2 className="text-xl font-semibold">Stap 1: Jaarrekening PDF</h2>
          <p className="text-gray-600 text-sm">
            Upload de jaarrekening (PDF). Deze wordt geparsed en pagina&apos;s
            worden ge-embed voor snelle analyse.
          </p>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
            className="text-gray-700"
          />
          {pdfFile && (
            <p className="text-sm text-gray-500 mt-1">
              Geselecteerd: {pdfFile.name}
            </p>
          )}

          <button
            onClick={handlePreparePdf}
            disabled={!pdfFile || loadingPrepare}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            {loadingPrepare ? "Bezig met verwerken..." : "PDF verwerken"}
          </button>

          {pdfId && (
            <p className="text-green-600 text-sm mt-2">
              ✔ PDF verwerkt. ID: {pdfId}
            </p>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!canGoNextFromStep1}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:bg-gray-400"
            >
              Volgende stap
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="p-6 bg-white rounded-xl shadow border space-y-4">
          <h2 className="text-xl font-semibold">Stap 2: Checklist toevoegen</h2>
          <p className="text-gray-600 text-sm">
            Upload de checklist (bijvoorbeeld het Excel-bestand dat je via je
            Python script naar JSON kunt converteren, of direct de JSON).
          </p>

          <input
            type="file"
            onChange={(e) => setChecklistFile(e.target.files?.[0] || null)}
            className="text-gray-700"
          />
          {checklistFile && (
            <p className="text-sm text-gray-500 mt-1">
              Geselecteerd: {checklistFile.name}
            </p>
          )}

          <button
            onClick={handleUploadChecklist}
            disabled={!checklistFile || loadingChecklist}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400"
          >
            {loadingChecklist ? "Checklist verwerken..." : "Checklist uploaden"}
          </button>

          {sheetNames.length > 0 && (
            <p className="text-green-600 text-sm mt-2">
              ✔ Checklist geladen. Beschikbare sheets: {sheetNames.join(", ")}
            </p>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
            >
              Terug
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canGoNextFromStep2}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:bg-gray-400"
            >
              Volgende stap
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="p-6 bg-white rounded-xl shadow border space-y-4">
          <h2 className="text-xl font-semibold">Stap 3: Sheet selecteren</h2>
          <p className="text-gray-600 text-sm">
            Kies welke sheet uit de checklist je wilt gebruiken voor de analyse
            (bijvoorbeeld &quot;Accountantscontrole&quot;).
          </p>

          {sheetNames.length === 0 ? (
            <p className="text-red-600 text-sm">
              Geen sheets gevonden. Ga terug naar stap 2 en upload een
              checklist.
            </p>
          ) : (
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="border rounded p-2 w-full max-w-md bg-white"
            >
              <option value="">Kies een sheet...</option>
              {sheetNames.length > 0 ? (
                sheetNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              ) : (
                <option disabled>Geen checklist-sheets gevonden</option>
              )}
            </select>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
            >
              Terug
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!canGoNextFromStep3}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg disabled:bg-gray-400"
            >
              Volgende stap
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="p-6 bg-white rounded-xl shadow border space-y-4">
          <h2 className="text-xl font-semibold">Stap 4: Rapport bekijken</h2>
          <p className="text-gray-600 text-sm">
            Start de analyse voor de gekozen sheet en bekijk de resultaten.
          </p>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Aantal checklist-items (voor test-run)
              </label>
              <input
                type="number"
                value={maxItems}
                min={1}
                onChange={(e) => setMaxItems(Number(e.target.value))}
                className="border p-2 rounded w-24"
              />
            </div>

            <button
              onClick={handleAnalyse}
              disabled={loadingAnalysis || !pdfId || !selectedSheet}
              className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400 mt-6"
            >
              {loadingAnalysis ? "Analyseren..." : "Analyse starten"}
            </button>
          </div>

          {/* Resultaten tonen */}
          {results && (
            <div className="mt-6 space-y-6">
              <h3 className="text-lg font-semibold">
                Resultaten voor sheet: {selectedSheet}
              </h3>

              {results.map((item, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 bg-gray-50 space-y-2"
                >
                  <p className="font-semibold text-gray-900">{item.vraag}</p>

                  {item.subvragen && item.subvragen?.length > 0 && (
                    <details className="ml-4">
                      <summary className="cursor-pointer text-gray-700 text-sm">
                        Subvragen
                      </summary>
                      <ul className="mt-1 list-disc ml-5 text-gray-600 text-sm">
                        {item.subvragen?.map((sv: string, i2: number) => (
                          <li key={i2}>{sv}</li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Relevante pagina&apos;s:
                    </p>
                    <ul className="ml-6 list-disc text-gray-600 text-sm">
                      {item.relevantPages.map(
                        (rp: { page: number; score: number }, i3: number) => (
                          <li key={i3}>
                            Pagina {rp.page} — score {rp.score.toFixed(3)}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div
                    className={`p-3 rounded ${
                      item.analyse?.gevonden ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      {item.analyse?.gevonden
                        ? "✔ Voorwaarde lijkt aanwezig in de jaarrekening"
                        : "✘ Voorwaarde niet (duidelijk) gevonden"}
                    </p>
                    <p className="text-xs">
                      Pagina: {item.analyse?.pagina ?? "—"} | Score:{" "}
                      {item.analyse?.score ?? 0}
                    </p>
                    <p className="text-xs mt-1 text-gray-700">
                      {item.analyse?.uitleg}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg"
            >
              Terug
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
