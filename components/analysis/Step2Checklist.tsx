"use client";

import { useState } from "react";

export default function Step2Checklist({
  onChecklistReady,
  onBack,
}: {
  onChecklistReady: (sheets: string[]) => void;
  onBack: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleNext = async () => {
    if (!file) {
      alert("Upload een Excel checklist.");
      return;
    }

    setProcessing(true);
    setProgress(10);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/checklist/upload", {
        method: "POST",
        body: form,
      });

      setProgress(60);
      const data = await res.json();
      if (!data.ok) throw new Error();

      setProgress(100);
      setTimeout(() => onChecklistReady(data.sheetNames), 400);
    } catch {
      alert("Checklist kon niet verwerkt worden.");
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-4">
      <h2 className="text-xl font-semibold">Stap 2: Checklist uploaden</h2>

      <input
        type="file"
        accept=".xlsx,.xlsm,.xls"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      {processing && (
        <div>
          <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-3 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded-lg">
          Terug
        </button>

        <button
          onClick={handleNext}
          disabled={!file || processing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
        >
          {processing ? "Bezig…" : "Volgende"}
        </button>
      </div>
    </div>
  );
}
