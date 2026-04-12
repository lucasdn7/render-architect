import { RenderConfig } from "@/types/promptRender";
import {
  RENDER_TYPE_OPTIONS, LIGHTING_OPTIONS, ENVIRONMENT_OPTIONS,
  SURROUNDING_OPTIONS, QUALITY_OPTIONS, CAMERA_OPTIONS,
} from "@/lib/promptMappings";

interface StepConfigProps {
  config: RenderConfig;
  onChange: (config: RenderConfig) => void;
  onNext: () => void;
}

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  desc?: string;
}

function OptionCard({ selected, onClick, icon, label, desc }: OptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`render-option text-left ${selected ? "selected" : ""}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-mono text-xs font-medium text-foreground">{label}</span>
      {desc && <span className="font-mono text-[10px] text-muted-foreground text-center leading-tight">{desc}</span>}
    </button>
  );
}

interface MultiOptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}

function MultiOptionCard({ selected, onClick, icon, label }: MultiOptionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`render-option flex-row gap-2 p-3 ${selected ? "selected" : ""}`}
    >
      <span className="text-lg">{icon}</span>
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

export default function StepConfig({ config, onChange, onNext }: StepConfigProps) {
  const update = (partial: Partial<RenderConfig>) => onChange({ ...config, ...partial });

  const toggleEnv = (id: string) => {
    const envs = config.environments.includes(id)
      ? config.environments.filter((e) => e !== id)
      : [...config.environments, id];
    update({ environments: envs });
  };

  const toggleSurroundings = (id: string) => {
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
      </div>

      {/* Render Type */}
      <div className="mb-10">
        <SectionTitle>Tipo de Render</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RENDER_TYPE_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              selected={config.renderType === opt.id}
              onClick={() => update({ renderType: opt.id })}
              icon={opt.icon}
              label={opt.label}
              desc={opt.desc}
            />
          ))}
        </div>
      </div>

      {/* Lighting */}
      <div className="mb-10">
        <SectionTitle>Período do Dia / Iluminação</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LIGHTING_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              selected={config.lighting === opt.id}
              onClick={() => update({ lighting: opt.id })}
              icon={opt.icon}
              label={opt.label}
              desc={opt.desc}
            />
          ))}
        </div>
      </div>

      {/* Environment Elements (multi-select) */}
      <div className="mb-10">
        <SectionTitle>Elementos do Ambiente</SectionTitle>
        <p className="text-muted-foreground font-mono text-xs mb-4">Selecione quantos desejar</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ENVIRONMENT_OPTIONS.map((opt) => (
            <MultiOptionCard
              key={opt.id}
              selected={config.environments.includes(opt.id)}
              onClick={() => toggleEnv(opt.id)}
              icon={opt.icon}
              label={opt.label}
            />
          ))}
        </div>
      </div>

      {/* Surroundings (multi-select) */}
      <div className="mb-10">
        <SectionTitle>Entorno</SectionTitle>
        <p className="text-muted-foreground font-mono text-xs mb-4">Selecione quantos desejar (opcional)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SURROUNDING_OPTIONS.map((opt) => (
            <MultiOptionCard
              key={opt.id}
              selected={config.surroundings.includes(opt.id)}
              onClick={() => toggleSurroundings(opt.id)}
              icon={opt.icon}
              label={opt.label}
            />
          ))}
        </div>
      </div>

      {/* Quality */}
      <div className="mb-10">
        <SectionTitle>Qualidade / Estilo</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUALITY_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              selected={config.quality === opt.id}
              onClick={() => update({ quality: opt.id })}
              icon={opt.icon}
              label={opt.label}
              desc={opt.desc}
            />
          ))}
        </div>
      </div>

      {/* Camera */}
      <div className="mb-10">
        <SectionTitle>Câmera / Perspectiva</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {CAMERA_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.id}
              selected={config.camera === opt.id}
              onClick={() => update({ camera: opt.id })}
              icon={opt.icon}
              label={opt.label}
              desc={opt.desc}
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
