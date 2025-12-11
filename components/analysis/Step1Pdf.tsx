"use client";

import { useEffect, useState } from "react";

type SavedPdf = {
  pdfId: string;
  name: string;
  uploadedAt: number;
  pageCount?: number;
};

export default function Step1Pdf({
  onPdfReady,
}: {
  onPdfReady: (pdfId: string) => void;
}) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [savedPdfs, setSavedPdfs] = useState<SavedPdf[]>([]);
  const [savedPdfId, setSavedPdfId] = useState<string>("");

  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // -----------------------------
  // Load previously saved PDFs
  // -----------------------------
  useEffect(() => {
    async function load() {
      setLoadingSaved(true);
      try {
        const res = await fetch("/api/user/pdfs");
        const data = await res.json();
        if (data.ok) {
          setSavedPdfs(data.items);
        }
      } catch (err) {
        console.error("Kon opgeslagen PDFs niet laden:", err);
      }
      setLoadingSaved(false);
    }
    load();
  }, []);

  // -----------------------------
  // NEXT when user selects a saved PDF
  // -----------------------------
  const handleUseSaved = () => {
    if (!savedPdfId) return;
    onPdfReady(savedPdfId);
  };

  // -----------------------------
  // UPLOAD + PROCESS new PDF
  // -----------------------------
  const handleUpload = async () => {
    if (!pdfFile) {
      alert("Upload eerst een PDF.");
      return;
    }

    setProcessing(true);
    setProgress(20);

    const form = new FormData();
    form.append("file", pdfFile);

    try {
      const res = await fetch("/api/prepare-pdf", {
        method: "POST",
        body: form,
      });

      setProgress(70);

      const data = await res.json();
      if (!data.ok) throw new Error("PDF kon niet verwerkt worden");

      setProgress(100);

      // Wait a moment so the progress bar reaches 100%
      setTimeout(() => onPdfReady(data.pdfId), 400);
    } catch (err) {
      alert("Er ging iets mis bij het verwerken.");
      console.error(err);
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-6">
      <h2 className="text-xl font-semibold">Stap 1: Upload of kies PDF</h2>

      {/* --------------------
          SELECT SAVED PDF
      --------------------- */}
      <div className="space-y-2">
        <label className="font-medium">Kies een eerder geüploade PDF</label>

        {loadingSaved ? (
          <p className="text-gray-500 text-sm">Laden…</p>
        ) : savedPdfs.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Je hebt nog geen opgeslagen PDF&apos;s.
          </p>
        ) : (
          <select
            className="border rounded p-2 w-full bg-white"
            value={savedPdfId}
            onChange={(e) => setSavedPdfId(e.target.value)}
          >
            <option value="">-- Selecteer opgeslagen PDF --</option>
            {savedPdfs.map((p) => (
              <option key={p.pdfId} value={p.pdfId}>
                {p.name} ({p.pageCount ?? "?"} pagina's)
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleUseSaved}
          disabled={!savedPdfId}
          className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-300"
        >
          Gebruik geselecteerde PDF
        </button>
      </div>

      <div className="border-t pt-6" />

      {/* --------------------
          UPLOAD NEW PDF
      --------------------- */}
      <div className="space-y-3">
        <label className="font-medium">Upload een nieuwe PDF</label>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
        />

        {processing && (
          <div>
            <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-3 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm mt-1">{progress}% verwerken…</p>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!pdfFile || processing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
        >
          {processing ? "Bezig…" : "Upload & Verwerk"}
        </button>
      </div>
    </div>
  );
}
