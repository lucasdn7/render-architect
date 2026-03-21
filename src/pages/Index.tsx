import { useState, useCallback } from "react";
import { Clock, Box } from "lucide-react";
import WizardProgress from "@/components/WizardProgress";
import StepUpload from "@/components/StepUpload";
import StepAnalysis from "@/components/StepAnalysis";
import StepConfig from "@/components/StepConfig";
import StepHumanization from "@/components/StepHumanization";
import StepResult from "@/components/StepResult";
import HistoryPanel from "@/components/HistoryPanel";
import { WizardState, ImageAnalysis } from "@/types/promptRender";
import { addToHistory } from "@/lib/history";
import {
  RENDER_TYPE_PROMPTS, LIGHTING_PROMPTS, ENVIRONMENT_PROMPTS,
  QUALITY_PROMPTS, CAMERA_PROMPTS, TECHNICAL_SUFFIX,
  HUMANIZATION_PROMPT_TEMPLATE, ANIMAL_PROMPT_TEMPLATE,
} from "@/lib/promptMappings";

const STEP_LABELS = ["Upload", "Análise", "Configurar", "Humanizar", "Resultado"];

const MOCK_ANALYSIS: ImageAnalysis = {
  IMAGE_TYPE: "3D Architectural Render",
  ARCHITECTURAL_STYLE: "Contemporary Minimalist",
  ENVIRONMENT: "Exterior",
  MATERIALS: "Exposed concrete, floor-to-ceiling glass panels, natural wood cladding, brushed steel",
  OBJECTS: "Modular outdoor furniture, infinity pool, mature olive trees, sculptural lighting fixtures",
  LIGHTING: "Natural daylight, late afternoon warm tones",
  COLORS: "Warm greys, off-white, natural wood tones, deep charcoal accents",
  TEXTURES: "Smooth concrete, reflective glass, rough-sawn timber, polished stone",
  SPATIAL_COMPOSITION: "Two-point perspective, wide-angle view, strong horizontal lines, foreground-to-background depth",
  ARCHITECTURAL_DETAILS: "Cantilevered roof overhang, recessed window frames, floating staircase, green roof section",
  ATMOSPHERE: "Serene, luxurious, harmonious integration with natural landscape",
  FULL_DESCRIPTION: "A contemporary minimalist residence rendered in late afternoon light, featuring exposed concrete volumes with floor-to-ceiling glazing and natural wood cladding. The exterior showcases a cantilevered roof extending over an infinity pool, framed by mature olive trees and sculptural landscape lighting. The composition emphasizes strong horizontal lines and harmonious material contrast between raw concrete, warm timber, and reflective glass surfaces.",
};

function buildPrompt(state: WizardState): string {
  const parts: string[] = [];

  // Image description
  if (state.analysis?.FULL_DESCRIPTION) {
    parts.push(state.analysis.FULL_DESCRIPTION);
  }

  // Render config prompts
  const { renderConfig } = state;
  if (renderConfig.renderType && RENDER_TYPE_PROMPTS[renderConfig.renderType]) {
    parts.push(RENDER_TYPE_PROMPTS[renderConfig.renderType]);
  }
  if (renderConfig.lighting && LIGHTING_PROMPTS[renderConfig.lighting]) {
    parts.push(LIGHTING_PROMPTS[renderConfig.lighting]);
  }
  for (const env of renderConfig.environments) {
    if (ENVIRONMENT_PROMPTS[env]) parts.push(ENVIRONMENT_PROMPTS[env]);
  }
  if (renderConfig.quality && QUALITY_PROMPTS[renderConfig.quality]) {
    parts.push(QUALITY_PROMPTS[renderConfig.quality]);
  }
  if (renderConfig.camera && CAMERA_PROMPTS[renderConfig.camera]) {
    parts.push(CAMERA_PROMPTS[renderConfig.camera]);
  }

  // Humanization
  const { humanization } = state;
  if (humanization.enabled) {
    if (humanization.addPeople && humanization.peopleDescription.trim()) {
      parts.push(HUMANIZATION_PROMPT_TEMPLATE(humanization.peopleDescription));
    }
    if (humanization.addAnimals && humanization.animalDescription.trim()) {
      parts.push(ANIMAL_PROMPT_TEMPLATE(humanization.animalDescription));
    }
  }

  // Technical suffix
  parts.push(TECHNICAL_SUFFIX);

  return parts.join(", ");
}

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

  const update = useCallback((partial: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const goToStep = (step: number) => update({ currentStep: step });

  const handleImageSelect = (file: File, preview: string) => {
    update({ imageFile: file, imagePreview: preview });
  };

  const handleAnalyze = () => {
    update({ currentStep: 1, isAnalyzing: true });
    // Simulate AI analysis (replace with real API call when backend is ready)
    setTimeout(() => {
      update({ analysis: MOCK_ANALYSIS, isAnalyzing: false });
    }, 2500);
  };

  const handleGeneratePrompt = () => {
    const prompt = buildPrompt(state);
    update({ currentStep: 4, finalPrompt: prompt });
    addToHistory({ prompt, imagePreview: state.imagePreview || undefined });
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
            onReset={handleReset}
          />
        )}
      </main>

      {/* History Panel */}
      <HistoryPanel open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
}
