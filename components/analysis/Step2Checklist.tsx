"use client";

import { useEffect, useState } from "react";

type SavedChecklist = {
  checklistId: string;
  name: string;
  uploadedAt: number;
  sheetCount: number;
};

export default function Step2Checklist({
  onChecklistReady,
  onBack,
}: {
  onChecklistReady: (sheetNames: string[], checklistId: string) => void;
  onBack: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const [savedChecklists, setSavedChecklists] = useState<SavedChecklist[]>([]);
  const [selectedSaved, setSelectedSaved] = useState<string>("");
  const [loadingSaved, setLoadingSaved] = useState(false);

  // -----------------------------
  // Load saved checklists
  // -----------------------------
  useEffect(() => {
    async function load() {
      setLoadingSaved(true);
      try {
        const res = await fetch("/api/user/checklists");
        const data = await res.json();

        if (data.ok) {
          setSavedChecklists(data.items);
        }
      } catch (err) {
        console.error("Kon opgeslagen checklists niet laden:", err);
      }
      setLoadingSaved(false);
    }
    load();
  }, []);

  // -----------------------------
  // Use a saved checklist
  // -----------------------------
  const handleUseSaved = async () => {
    if (!selectedSaved) return;

    try {
      const res = await fetch(`/api/user/checklist?id=${selectedSaved}`);
      const data = await res.json();

      if (!data.ok) throw new Error("Kon checklist niet laden");

      const sheetNames = [
        ...new Set<string>(data.checklist.map((item: any) => item.sheet)),
      ];
      onChecklistReady(sheetNames, selectedSaved);
    } catch (err) {
      console.error(err);
      alert("Kon opgeslagen checklist niet laden.");
    }
  };

  // -----------------------------
  // Upload new checklist
  // -----------------------------
  const handleNext = async () => {
    if (!file) {
      alert("Upload een Excel bestand.");
      return;
    }

    setProcessing(true);
    setProgress(15);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/checklist/upload", {
        method: "POST",
        body: form,
      });

      setProgress(70);
      const data = await res.json();
      if (!data.ok) throw new Error();

      setProgress(100);
      setTimeout(() => {
        onChecklistReady(data.sheetNames, data.checklistId);
      }, 300);
    } catch (err) {
      alert("Checklist kon niet verwerkt worden.");
      console.error(err);
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow space-y-6">
      <h2 className="text-xl font-semibold">
        Stap 2: Checklist uploaden of kiezen
      </h2>

      {/* ------------------------------
          Saved checklist selection
      ------------------------------- */}
      <div className="space-y-2">
        <label className="font-medium">Gebruik een eerdere checklist</label>

        {loadingSaved ? (
          <p className="text-sm text-gray-500">Laden…</p>
        ) : savedChecklists.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nog geen checklists opgeslagen.
          </p>
        ) : (
          <select
            className="border rounded p-2 w-full bg-white"
            value={selectedSaved}
            onChange={(e) => setSelectedSaved(e.target.value)}
          >
            <option value="">-- Kies opgeslagen checklist --</option>
            {savedChecklists.map((kb) => (
              <option key={kb.checklistId} value={kb.checklistId}>
                {kb.name} ({kb.sheetCount} sheets)
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleUseSaved}
          disabled={!selectedSaved}
          className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-300"
        >
          Gebruik geselecteerde checklist
        </button>
      </div>

      <div className="border-t pt-6" />

      {/* ------------------------------
          Upload new checklist
      ------------------------------- */}
      <div className="space-y-4">
        <label className="font-medium">Upload een nieuwe checklist</label>

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
            <p className="text-sm mt-1">{progress}% verwerken…</p>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!file || processing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300"
        >
          {processing ? "Bezig…" : "Upload & Verwerk"}
        </button>
      </div>

      {/* ------------------------------
          Navigation
      ------------------------------- */}
      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="px-4 py-2 bg-gray-200 rounded-lg">
          Terug
        </button>
      </div>
    </div>
  );
}
