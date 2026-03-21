import { ImageAnalysis } from "@/types/promptRender";
import { ANALYSIS_LABELS } from "@/lib/promptMappings";
import { Loader2 } from "lucide-react";

interface StepAnalysisProps {
  analysis: ImageAnalysis | null;
  isAnalyzing: boolean;
  onNext: () => void;
}

export default function StepAnalysis({ analysis, isAnalyzing, onNext }: StepAnalysisProps) {
  if (isAnalyzing) {
    return (
      <div className="animate-fade-up max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "hsl(var(--gold) / 0.1)" }}>
          <Loader2 className="w-7 h-7 text-gold animate-spin" />
        </div>
        <h2 className="font-display text-2xl font-semibold mb-2" style={{ lineHeight: 1.1 }}>
          Lendo cada detalhe da sua imagem...
        </h2>
        <p className="text-muted-foreground font-mono text-sm">
          Nossa IA está analisando estilo, materiais, iluminação e composição
        </p>
        <div className="mt-8 mx-auto max-w-xs h-1 rounded-full overflow-hidden" style={{ background: "hsl(var(--surface-3))" }}>
          <div className="h-full gold-gradient animate-shimmer rounded-full" style={{ width: "60%" }} />
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const fields = Object.entries(ANALYSIS_LABELS);

  return (
    <div className="animate-fade-up max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <span className="step-badge mb-4">Step 02</span>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mt-4 mb-2" style={{ lineHeight: 1.1 }}>
          Análise da Imagem
        </h2>
        <p className="text-muted-foreground font-mono text-sm">
          Detalhes técnicos identificados pela IA
        </p>
      </div>

      <div className="surface-card p-6">
        <div className="grid gap-3">
          {fields.map(([key, { label, icon }], i) => (
            <div
              key={key}
              className="flex items-start gap-3 p-3 rounded-lg transition-colors duration-200"
              style={{
                background: "hsl(var(--surface-2))",
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <span className="text-lg mt-0.5 shrink-0">{icon}</span>
              <div className="min-w-0">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-0.5">
                  {label}
                </div>
                <div className="text-sm font-mono text-foreground">
                  {(analysis as Record<string, string>)[key] || "—"}
                </div>
              </div>
            </div>
          ))}
        </div>

        {analysis.FULL_DESCRIPTION && (
          <div className="mt-4 p-4 rounded-lg" style={{ background: "hsl(var(--gold) / 0.05)", border: "1px solid hsl(var(--gold) / 0.15)" }}>
            <div className="text-xs font-mono uppercase tracking-wider text-gold mb-2">Descrição Completa</div>
            <p className="text-sm font-mono text-foreground leading-relaxed">{analysis.FULL_DESCRIPTION}</p>
          </div>
        )}
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={onNext}
          className="gold-gradient px-8 py-3 rounded-lg font-mono text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.97]"
        >
          Continuar para Configurações →
        </button>
      </div>
    </div>
  );
}
