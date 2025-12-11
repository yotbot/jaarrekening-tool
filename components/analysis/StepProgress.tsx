"use client";

export default function StepProgress({ step }: { step: number }) {
  const steps = [
    { id: 1, label: "PDF Uploaden" },
    { id: 2, label: "Checklist Uploaden" },
    { id: 3, label: "Analyse" },
  ];

  return (
    <div className="flex items-center justify-between max-w-6xl mx-auto py-2">
      {steps.map((s, i) => {
        const isActive = s.id === step;
        const isDone = s.id < step;

        return (
          <div key={s.id} className="flex items-center flex-1">
            {/* STEP BUBBLE */}
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold 
                transition-all 
              `}
              style={{
                backgroundColor: isActive
                  ? "var(--theme-brand-3)"
                  : isDone
                  ? "var(--theme-brand-2)"
                  : "var(--theme-neutral-2)",
                color:
                  isActive || isDone
                    ? "var(--theme-foreground-inverse)"
                    : "var(--theme-foreground)",
              }}
            >
              {s.id}
            </div>

            {/* LABEL */}
            <div className="ml-3">
              <p
                className="text-sm font-mono"
                style={{ color: "var(--theme-foreground)" }}
              >
                {s.label}
              </p>
            </div>

            {/* LINE BETWEEN STEPS */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 bg-neutral-4 rounded transition-all" />
            )}
          </div>
        );
      })}
    </div>
  );
}
