interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export default function WizardProgress({ currentStep, totalSteps, labels }: WizardProgressProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-lg mx-auto mb-12">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`wizard-progress-dot ${
                i < currentStep ? "completed" : i === currentStep ? "active" : ""
              }`}
            />
            <span
              className="font-mono text-[9px] uppercase tracking-wider hidden md:block"
              style={{
                color: i <= currentStep ? "hsl(var(--gold))" : "hsl(var(--text-tertiary))",
              }}
            >
              {labels[i]}
            </span>
          </div>
          {i < totalSteps - 1 && (
            <div className={`wizard-progress-line mx-1 ${i < currentStep ? "active" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}
