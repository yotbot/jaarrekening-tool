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
    <section className="p-6 bg-white rounded-xl space-y-6 font-sans">
      <p className="uppercase font-mono mb-5 bg-tag-background inline-block px-5 py-3 rounded-full text-xs text-white">
        Stap 2
      </p>
      <h2 className="text-3xl font-semibold text-foreground">
        Checklist uploaden of kiezen
      </h2>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* ------------------------------
          Saved checklist selection
      ------------------------------- */}
        <div>
          <div className="bg-neutral-3 p-4 flex items-center justify-center">
            <p className="font-semibold">Gebruik een eerdere checklist</p>
          </div>

          <label className="font-medium hidden">
            Gebruik een eerdere checklist
          </label>

          <div className="px-6 py-10 border border-neutral-3 space-y-6 flex flex-col text-foreground">
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
              className="px-12 py-6 font-mono uppercase rounded-xl text-sm font-medium border text-background bg-foreground cursor-pointer disabled:bg-neutral-3"
            >
              Gebruik geselecteerde checklist
            </button>
          </div>
        </div>

        {/* ------------------------------
          Upload new checklist
      ------------------------------- */}
        <div>
          <div className="bg-neutral-3 p-4 flex items-center justify-center">
            <p className="font-semibold">Upload een nieuwe checklist</p>
          </div>
          <label className="font-medium hidden">
            Upload een nieuwe checklist
          </label>

          <div className="px-6 py-10 border border-neutral-3 space-y-6 flex flex-col">
            <label
              className="
    border border-foreground rounded-xl px-6 py-5 cursor-pointer 
     hover:bg-neutral-2 transition flex flex-col items-center 
    text-center gap-2 bg-white
  "
            >
              <span className="font-semibold text-sm">
                {file ? file.name : "Klik om checklist te selecteren"}
              </span>
              <input
                type="file"
                accept=".xlsx,.xlsm,.xls"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
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
              onClick={handleNext}
              disabled={!file || processing}
              className="px-12 py-6 font-mono uppercase rounded-xl text-sm font-medium border text-background bg-foreground cursor-pointer disabled:bg-neutral-3"
            >
              {processing ? "Bezig…" : "Upload & Verwerk"}
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------
          Navigation
      ------------------------------- */}
      <div className="flex justify-between pt-2">
        <button
          onClick={onBack}
          className="px-12 py-6 font-mono uppercase rounded-xl text-sm font-medium border text-foreground bg-background cursor-pointer "
        >
          Terug
        </button>
      </div>
    </section>
  );
}
