import { useState, useCallback } from "react";
import { Clock, Box, LogOut, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import WizardProgress from "@/components/WizardProgress";
import StepUpload from "@/components/StepUpload";
import StepAnalysis from "@/components/StepAnalysis";
import StepConfig from "@/components/StepConfig";
import StepHumanization from "@/components/StepHumanization";
import StepResult from "@/components/StepResult";
import HistoryPanel from "@/components/HistoryPanel";
import { WizardState } from "@/types/promptRender";
import { addToHistory } from "@/lib/history";
import { analyzeImage, generateFinalPrompt } from "@/services/aiService";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const STEP_LABELS = ["Upload", "Análise", "Configurar", "Humanizar", "Resultado"];

const LOADING_MESSAGES = [
  "Analisando estrutura arquitetônica...",
  "Identificando materiais e texturas...",
  "Mapeando composição espacial...",
  "Concluindo análise detalhada...",
];

const initialState: WizardState = {
  currentStep: 0,
  imageFile: null,
  imagePreview: null,
  analysis: null,
  isAnalyzing: false,
  renderConfig: {
    renderType: "",
    lighting: "",
    environments: [],
    surroundings: [],
    quality: "",
    camera: "",
  },
  humanization: {
    enabled: false,
    addPeople: false,
    peopleDescription: "",
    addAnimals: false,
    animalDescription: "",
  },
  finalPrompt: "",
};

export default function Index() {
  const [state, setState] = useState<WizardState>(initialState);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { credits, refreshCredits, signOut } = useAuth();

  const update = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const goToStep = (step: number) => update({ currentStep: step });

  const handleImageSelect = (file: File, preview: string) => {
    update({ imageFile: file, imagePreview: preview });
  };

  const handleAnalyze = async () => {
    if (!state.imagePreview) return;

    update({ currentStep: 1, isAnalyzing: true });

    // Cycle through loading messages
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(LOADING_MESSAGES[msgIndex]);
    }, 2500);

    try {
      const analysis = await analyzeImage(state.imagePreview);
      update({ analysis, isAnalyzing: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao analisar imagem";
      toast.error(message);
      update({ currentStep: 0, isAnalyzing: false });
    } finally {
      clearInterval(msgInterval);
    }
  };

  const getSelectedKeys = (): string[] => {
    const { renderConfig } = state;
    const keys: string[] = [];

    // Map existing config IDs to promptsConfig keys
    const renderTypeMap: Record<string, string> = {
      exterior: "render_externo",
      interior: "render_interno",
      aerial: "render_aereo",
      detail: "render_detalhe",
      section: "render_corte",
      planta_humanizada: "planta_humanizada",
    };
    const lightingMap: Record<string, string> = {
      daylight: "diurno",
      golden_hour: "entardecer",
      night: "noturno",
      cloudy: "nublado",
      rain: "chuva",
      dawn: "amanhecer",
    };
    const envMap: Record<string, string> = {
      pool: "piscina",
      garden: "jardim",
      gourmet: "area_gourmet",
      garage: "garagem",
      deck: "deck",
      scenic_lighting: "iluminacao_cenica",
      fog: "nevoa",
      water_mirror: "espelho_dagua",
    };
    const surroundingsMap: Record<string, string> = {
      residential: "entorno_residencial",
      commercial: "entorno_comercial",
      vegetation: "entorno_vegetacao",
      buildings: "entorno_predios",
      houses: "entorno_casas",
    };
    const qualityMap: Record<string, string> = {
      photorealistic: "fotorrealista",
      classic: "classico",
      atmospheric: "atmosferico",
      minimalist: "minimalista",
    };
    const cameraMap: Record<string, string> = {
      eye_level: "eye_level",
      worms_eye: "worm_eye",
      birds_eye: "bird_eye",
      dutch_angle: "dutch_angle",
      wide_angle: "wide_angle",
    };

    if (renderConfig.renderType && renderTypeMap[renderConfig.renderType]) {
      keys.push(renderTypeMap[renderConfig.renderType]);
    }
    if (renderConfig.lighting && lightingMap[renderConfig.lighting]) {
      keys.push(lightingMap[renderConfig.lighting]);
    }
    for (const env of renderConfig.environments) {
      if (envMap[env]) keys.push(envMap[env]);
    }
    for (const sur of renderConfig.surroundings) {
      if (surroundingsMap[sur]) keys.push(surroundingsMap[sur]);
    }
    if (renderConfig.quality && qualityMap[renderConfig.quality]) {
      keys.push(qualityMap[renderConfig.quality]);
    }
    if (renderConfig.camera && cameraMap[renderConfig.camera]) {
      keys.push(cameraMap[renderConfig.camera]);
    }

    return keys;
  };

  const handleGeneratePrompt = async () => {
    const { data: consumed, error: cErr } = await supabase.rpc("consume_credit");
    if (cErr || !consumed) {
      toast.error("Você não tem créditos disponíveis. Faça upgrade para continuar.");
      return;
    }
    await refreshCredits();

    setIsGenerating(true);
    update({ currentStep: 4 });

    try {
      const selectedKeys = getSelectedKeys();
      const imageDescription = state.analysis?.FULL_DESCRIPTION || "";

      const prompt = await generateFinalPrompt(
        imageDescription,
        selectedKeys,
        state.humanization
      );

      update({ finalPrompt: prompt });
      await addToHistory({
        prompt,
        imagePreview: state.imagePreview || undefined,
        renderConfig: {
          render: state.renderConfig,
          humanization: state.humanization,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao gerar prompt";
      toast.error(message);
      update({ currentStep: 3 });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleReset = () => setState(initialState);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center gold-gradient">
            <Box className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold leading-none" style={{ lineHeight: 1 }}>
              Prompt<span className="gold-text">Render</span>
            </h1>
            <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">
              Architectural AI Prompts
            </p>
          </div>
        </div>
        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
          style={{ border: "1px solid hsl(var(--border))" }}
        >
          <Clock className="w-3.5 h-3.5" />
          Histórico
        </button>
      </header>

      {/* Main Content */}
      <main className="px-6 py-10 max-w-5xl mx-auto">
        <WizardProgress
          currentStep={state.currentStep}
          totalSteps={5}
          labels={STEP_LABELS}
        />

        {state.currentStep === 0 && (
          <StepUpload
            imageFile={state.imageFile}
            imagePreview={state.imagePreview}
            onImageSelect={handleImageSelect}
            onClear={() => update({ imageFile: null, imagePreview: null })}
            onNext={handleAnalyze}
          />
        )}

        {state.currentStep === 1 && (
          <StepAnalysis
            analysis={state.analysis}
            isAnalyzing={state.isAnalyzing}
            loadingMessage={loadingMessage}
            onNext={() => goToStep(2)}
          />
        )}

        {state.currentStep === 2 && (
          <StepConfig
            config={state.renderConfig}
            onChange={(renderConfig) => update({ renderConfig })}
            onNext={() => goToStep(3)}
          />
        )}

        {state.currentStep === 3 && (
          <StepHumanization
            config={state.humanization}
            onChange={(humanization) => update({ humanization })}
            onNext={handleGeneratePrompt}
          />
        )}

        {state.currentStep === 4 && (
          <StepResult
            prompt={state.finalPrompt}
            isGenerating={isGenerating}
            onReset={handleReset}
          />
        )}
      </main>

      {/* History Panel */}
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
