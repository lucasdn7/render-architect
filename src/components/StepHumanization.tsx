import { HumanizationConfig } from "@/types/promptRender";
import { Users, PawPrint } from "lucide-react";

interface StepHumanizationProps {
  config: HumanizationConfig;
  onChange: (config: HumanizationConfig) => void;
  onNext: () => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group"
    >
      <div
        className="w-11 h-6 rounded-full relative transition-colors duration-300"
        style={{ background: checked ? "hsl(var(--gold))" : "hsl(var(--surface-3))" }}
      >
        <div
          className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-300"
          style={{
            background: checked ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
            transform: checked ? "translateX(22px)" : "translateX(2px)",
          }}
        />
      </div>
      <span className="font-mono text-sm text-foreground">{label}</span>
    </button>
  );
}

export default function StepHumanization({ config, onChange, onNext }: StepHumanizationProps) {
  const update = (partial: Partial<HumanizationConfig>) => onChange({ ...config, ...partial });

  return (
    <div className="animate-fade-up max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <span className="step-badge mb-4">Step 04</span>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mt-4 mb-2" style={{ lineHeight: 1.1 }}>
          Humanização
        </h2>
        <p className="text-muted-foreground font-mono text-sm">
          Dar vida ao espaço com presença humana
        </p>
      </div>

      <div className="surface-card p-6 mb-6">
        <Toggle
          checked={config.enabled}
          onChange={(v) => update({ enabled: v, addPeople: v ? config.addPeople : false, addAnimals: v ? config.addAnimals : false })}
          label="Deseja adicionar pessoas ou animais ao render?"
        />
      </div>

      {config.enabled && (
        <div className="space-y-4" style={{ animation: "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) forwards" }}>
          {/* People */}
          <div className="surface-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--gold) / 0.1)" }}>
                <Users className="w-4 h-4 text-gold" />
              </div>
              <Toggle
                checked={config.addPeople}
                onChange={(v) => update({ addPeople: v })}
                label="Adicionar pessoas"
              />
            </div>
            {config.addPeople && (
              <textarea
                value={config.peopleDescription}
                onChange={(e) => update({ peopleDescription: e.target.value })}
                placeholder="2 pessoas adultas, casal jovem, roupas casuais elegantes, caminhando pela entrada..."
                className="w-full p-4 rounded-lg font-mono text-sm resize-none focus:outline-none transition-colors duration-200"
                style={{
                  background: "hsl(var(--surface-2))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                  minHeight: 80,
                }}
                rows={3}
              />
            )}
          </div>

          {/* Animals */}
          <div className="surface-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--gold) / 0.1)" }}>
                <PawPrint className="w-4 h-4 text-gold" />
              </div>
              <Toggle
                checked={config.addAnimals}
                onChange={(v) => update({ addAnimals: v })}
                label="Adicionar animais"
              />
            </div>
            {config.addAnimals && (
              <textarea
                value={config.animalDescription}
                onChange={(e) => update({ animalDescription: e.target.value })}
                placeholder="1 cachorro Golden Retriever, sentado no jardim, olhando para a câmera..."
                className="w-full p-4 rounded-lg font-mono text-sm resize-none focus:outline-none transition-colors duration-200"
                style={{
                  background: "hsl(var(--surface-2))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                  minHeight: 80,
                }}
                rows={3}
              />
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center mt-8">
        <button
          onClick={onNext}
          className="gold-gradient px-8 py-3 rounded-lg font-mono text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.97]"
        >
          Gerar Prompt Final →
        </button>
      </div>
    </div>
  );
}
