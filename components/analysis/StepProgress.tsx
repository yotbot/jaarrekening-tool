"use client";

export default function StepProgress({ step }: { step: number }) {
  const steps = [
    { id: 1, label: "PDF Uploaden" },
    { id: 2, label: "Checklist Uploaden" },
    { id: 3, label: "Analyse" },
  ];

  return (
    <div className="flex items-center justify-between max-w-6xl px-2 md:px-0 mx-auto my-2 md:my-6 py-2">
      {steps.map((s, i) => {
        const isActive = s.id === step;
        const isDone = s.id < step;

        return (
          <div key={s.id} className="flex items-center flex-1">
            {/* STEP BUBBLE */}
            <div
              className={`
                w-5 h-5 md:w-10 md:h-10 md:rounded-full flex items-center justify-center font-semibold 
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
            <div className="ml-2 md:ml-3">
              <p
                className="text-xs md:text-sm font-mono"
                style={{ color: "var(--theme-foreground)" }}
              >
                {s.label}
              </p>
            </div>

            {/* LINE BETWEEN STEPS */}
            {i < steps.length - 1 && (
              <div className="hidden md:block flex-1 h-0.5 mx-4 bg-neutral-4 rounded transition-all" />
            )}
          </div>
        );
      })}
    </div>
  );
}
