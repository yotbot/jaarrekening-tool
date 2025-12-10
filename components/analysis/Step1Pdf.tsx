"use client";

import { useState } from "react";

export default function Step1Pdf({
  onPdfReady,
}: {
  onPdfReady: (pdfId: string) => void;
}) {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleNext = async () => {
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

      if (!data.ok) throw new Error("Kon PDF niet verwerken");

      setProgress(100);
      setTimeout(() => onPdfReady(data.pdfId), 400);
    } catch (e) {
      alert("Er ging iets mis.");
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold">Stap 1: Upload PDF</h2>

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
          <p className="text-sm mt-1">{progress}% verwerken</p>
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!pdfFile || processing}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {processing ? "Bezig…" : "Volgende"}
      </button>
    </div>
  );
}
