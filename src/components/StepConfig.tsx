import { RenderConfig } from "@/types/promptRender";
import { Lock } from "lucide-react";
import {
  RENDER_TYPE_OPTIONS, LIGHTING_OPTIONS, ENVIRONMENT_OPTIONS,
  SURROUNDING_OPTIONS, QUALITY_OPTIONS, CAMERA_OPTIONS,
} from "@/lib/promptMappings";
import { isOptionAllowed, PlanTier } from "@/config/planPermissions";

interface StepConfigProps {
  config: RenderConfig;
  onChange: (config: RenderConfig) => void;
  onNext: () => void;
  effectivePlan: PlanTier;
}

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
  disabled?: boolean;
  lockLabel?: string;
}

function OptionCard({ selected, onClick, label, desc, disabled, lockLabel }: OptionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? lockLabel : undefined}
      className={`render-option text-left ${selected ? "selected" : ""} ${disabled ? "render-option-disabled" : ""}`}
    >
      {disabled && (
        <span className="absolute top-2 right-2 text-muted-foreground">
          <Lock className="w-3.5 h-3.5" />
        </span>
      )}
      <span className="font-mono text-xs font-medium text-foreground">{label}</span>
      {desc && <span className="font-mono text-[10px] text-muted-foreground text-center leading-tight">{desc}</span>}
    </button>
  );
}

interface MultiOptionCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  lockLabel?: string;
}

function MultiOptionCard({ selected, onClick, label, disabled, lockLabel }: MultiOptionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? lockLabel : undefined}
      className={`render-option flex-row gap-2 p-3 ${selected ? "selected" : ""} ${disabled ? "render-option-disabled" : ""}`}
    >
      {disabled && <Lock className="w-3.5 h-3.5 text-muted-foreground" />}
      <span className="font-mono text-xs font-medium text-foreground">{label}</span>
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-lg font-semibold mb-4 text-foreground" style={{ lineHeight: 1.2 }}>
      {children}
    </h3>
  );
}

export default function StepConfig({ config, onChange, onNext, effectivePlan }: StepConfigProps) {
  const update = (partial: Partial<RenderConfig>) => onChange({ ...config, ...partial });
  const lockedLabel = "Disponível no plano Pro (ou usando crédito avulso)";

  const toggleEnv = (id: string) => {
    if (!isOptionAllowed(effectivePlan, "environments", id)) return;
    const envs = config.environments.includes(id)
      ? config.environments.filter((e) => e !== id)
      : [...config.environments, id];
    update({ environments: envs });
  };

  const toggleSurroundings = (id: string) => {
    if (!isOptionAllowed(effectivePlan, "surroundings", id)) return;
    const surs = config.surroundings.includes(id)
      ? config.surroundings.filter((s) => s !== id)
      : [...config.surroundings, id];
    update({ surroundings: surs });
  };

  return (
    <div className="animate-fade-up max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <span className="step-badge mb-4">Step 03</span>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mt-4 mb-2" style={{ lineHeight: 1.1 }}>
          Configurações do Render
        </h2>
        <p className="text-muted-foreground font-mono text-sm">
          Como você imagina esse render?
        </p>
        <p className="font-mono text-xs mt-3" style={{ color: "#C9A84C" }}>
          {effectivePlan === "pro"
            ? "Plano efetivo: Pro (todas as opções liberadas)"
            : "Plano efetivo: Free/Starter (algumas opções exigem Pro)"}
        </p>
      </div>

      <div className="mb-10">
        <SectionTitle>Tipo de Render</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RENDER_TYPE_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              selected={config.renderType === opt.id}
              onClick={() => update({ renderType: opt.id })}
              label={opt.label}
              desc={opt.desc}
              disabled={!isOptionAllowed(effectivePlan, "renderType", opt.id)}
              lockLabel={lockedLabel}
            />
          ))}
        </div>
      </div>

      <div className="mb-10">
        <SectionTitle>Período do Dia / Iluminação</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LIGHTING_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              selected={config.lighting === opt.id}
              onClick={() => update({ lighting: opt.id })}
              label={opt.label}
              desc={opt.desc}
              disabled={!isOptionAllowed(effectivePlan, "lighting", opt.id)}
              lockLabel={lockedLabel}
            />
          ))}
        </div>
      </div>

      <div className="mb-10">
        <SectionTitle>Qualidade / Estilo de Render</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUALITY_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              selected={config.quality === opt.id}
              onClick={() => update({ quality: opt.id })}
              label={opt.label}
              desc={opt.desc}
              disabled={!isOptionAllowed(effectivePlan, "quality", opt.id)}
              lockLabel={lockedLabel}
            />
          ))}
        </div>
      </div>

      <div className="mb-10">
        <SectionTitle>Elementos do Ambiente</SectionTitle>
        <p className="text-muted-foreground font-mono text-xs mb-4">Selecione quantos desejar</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ENVIRONMENT_OPTIONS.map((opt) => (
            <MultiOptionCard
              key={opt.id}
              selected={config.environments.includes(opt.id)}
              onClick={() => toggleEnv(opt.id)}
              label={opt.label}
              disabled={!isOptionAllowed(effectivePlan, "environments", opt.id)}
              lockLabel={lockedLabel}
            />
          ))}
        </div>
      </div>

      <div className="mb-10">
        <SectionTitle>Entorno</SectionTitle>
        <p className="text-muted-foreground font-mono text-xs mb-4">Selecione quantos desejar (opcional)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SURROUNDING_OPTIONS.map((opt) => (
            <MultiOptionCard
              key={opt.id}
              selected={config.surroundings.includes(opt.id)}
              onClick={() => toggleSurroundings(opt.id)}
              label={opt.label}
              disabled={!isOptionAllowed(effectivePlan, "surroundings", opt.id)}
              lockLabel={lockedLabel}
            />
          ))}
        </div>
      </div>

      <div className="mb-10">
        <SectionTitle>Câmera / Perspectiva</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CAMERA_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              selected={config.camera === opt.id}
              onClick={() => update({ camera: opt.id })}
              label={opt.label}
              desc={opt.desc}
              disabled={!isOptionAllowed(effectivePlan, "camera", opt.id)}
              lockLabel={lockedLabel}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="gold-gradient px-8 py-3 rounded-lg font-mono text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.97]"
        >
          Continuar →
        </button>
      </div>
    </div>
  );
}
