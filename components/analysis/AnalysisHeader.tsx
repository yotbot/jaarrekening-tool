"use client";

export default function AnalysisHeader({
  pdfId,
  checklistId,
  sheet,
}: {
  pdfId: string;
  checklistId: string;
  sheet: string;
}) {
  return (
    <div className="bg-linear-to-r from-gray-900 to-gray-700 text-white p-6 rounded-xl shadow">
      <h1 className="text-2xl font-semibold">Jaarrekening Analyse</h1>

      <div className="mt-4 space-y-1 text-sm opacity-90">
        <p>
          <b>PDF:</b> {pdfId}
        </p>
        <p>
          <b>Checklist:</b> {checklistId}
        </p>
        <p>
          <b>Sheet:</b> {sheet}
        </p>
      </div>
    </div>
  );
}
