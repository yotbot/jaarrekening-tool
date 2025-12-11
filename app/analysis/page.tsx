"use client";

import { useState } from "react";
import Step1Pdf from "@/components/analysis/Step1Pdf";
import Step2Checklist from "@/components/analysis/Step2Checklist";
import AnalysisPanel from "@/components/analysis/AnalysisPanel";

export default function AnalysisWizardPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [pdfId, setPdfId] = useState<string | null>(null);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [checklistLoaded, setChecklistLoaded] = useState(false);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold">Jaarrekening Analyse</h1>

      {step === 1 && (
        <Step1Pdf
          onPdfReady={(id: string) => {
            setPdfId(id);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <Step2Checklist
          onChecklistReady={(sheets: string[], checklistId: string) => {
            setSheetNames(sheets);
            setChecklistId(checklistId);
            setChecklistLoaded(true);
            setStep(3);
          }}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <AnalysisPanel
          checklistId={checklistId!}
          pdfId={pdfId!}
          sheetNames={sheetNames}
        />
      )}
    </div>
  );
}
