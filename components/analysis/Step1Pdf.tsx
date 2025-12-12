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
    <section className="p-6 bg-white rounded-xl space-y-6 font-sans">
      <p className="uppercase font-mono mb-5 bg-tag-background inline-block px-5 py-3 rounded-full text-xs text-white">
        Stap 1
      </p>
      <h2 className="text-3xl font-semibold text-foreground">
        Upload of kies PDF
      </h2>

      <div className="grid gap-6 sm:grid-cols-2 text-foreground">
        {/* --------------------
          SELECT SAVED PDF
      --------------------- */}
        <div>
          <div className="bg-neutral-3 p-4 flex items-center justify-center">
            <p className="font-semibold">Kies een eerder geüploade PDF</p>
          </div>

          <label className="font-medium hidden">
            Kies een eerder geüploade PDF
          </label>

          <div className="px-6 py-10 border border-neutral-3 space-y-6 flex flex-col">
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
              className="px-12 py-6 font-mono uppercase rounded-xl text-sm font-medium border text-background bg-foreground cursor-pointer disabled:bg-neutral-3"
            >
              Gebruik geselecteerde PDF
            </button>
          </div>
        </div>

        {/* --------------------
          UPLOAD NEW PDF
      --------------------- */}
        <div>
          <div className="bg-neutral-3 p-4 flex items-center justify-center">
            <p className="font-semibold">Upload een nieuwe PDF</p>
          </div>
          <label className="font-medium hidden"></label>
          <div className="px-6 py-10 border border-neutral-3 space-y-6 flex flex-col">
            {/* CUSTOM FILE INPUT */}
            <label
              className="
    border border-foreground rounded-xl px-6 py-5 cursor-pointer 
     hover:bg-neutral-2 transition flex flex-col items-center 
    text-center gap-2 bg-white
  "
            >
              <span className="font-semibold text-sm">
                {pdfFile ? pdfFile.name : "Klik om PDF te selecteren"}
              </span>

              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              />
            </label>

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
              className="px-12 py-6 font-mono uppercase rounded-xl text-sm font-medium border text-background bg-foreground cursor-pointer disabled:bg-neutral-3"
            >
              {processing ? "Bezig…" : "Upload & Verwerk"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
