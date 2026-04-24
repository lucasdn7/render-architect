import { useState, useCallback } from "react";
import { Box } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import WizardProgress from "@/components/WizardProgress";
import StepUpload from "@/components/StepUpload";
import StepAnalysis from "@/components/StepAnalysis";
import StepConfig from "@/components/StepConfig";
import StepHumanization from "@/components/StepHumanization";
import StepResult from "@/components/StepResult";
import HistoryPanel from "@/components/HistoryPanel";
import { WizardState } from "@/types/promptRender";
import { analyzeImage, generateFinalPrompt } from "@/services/aiService";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getEffectivePlan, mapRenderConfigToPromptKeys, PlanTier } from "@/config/planPermissions";
import { consumeCreditFallbackCompat } from "@/lib/creditCompat";

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
  const [usedKeys, setUsedKeys] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const { user, credits, refreshCredits, currentPlan, bonusCredits } = useAuth();
  const effectivePlan = getEffectivePlan(currentPlan, bonusCredits > 0);

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

  const getSelectedKeys = (): string[] => mapRenderConfigToPromptKeys(state.renderConfig);

  const consumeCreditFallback = async (): Promise<{
    consumed: boolean;
    credit_type: "avulso" | "plan" | null;
    effective_plan: PlanTier;
  }> => {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) {
      return { consumed: false, credit_type: null, effective_plan: effectivePlan };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("prompt_credits, avulso_credits, plan")
      .eq("user_id", userId)
      .maybeSingle();

    if (!profile) {
      return { consumed: false, credit_type: null, effective_plan: effectivePlan };
    }

    const avulso = profile.avulso_credits ?? 0;
    const promptCredits = profile.prompt_credits ?? 0;
    const plan = (profile.plan as PlanTier | null) ?? "free";

    if (avulso > 0) {
      const { error } = await supabase
        .from("profiles")
        .update({
          avulso_credits: avulso - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) return { consumed: false, credit_type: null, effective_plan: plan };
      return { consumed: true, credit_type: "avulso", effective_plan: "pro" };
    }

    if (promptCredits > 0) {
      const { error } = await supabase
        .from("profiles")
        .update({
          prompt_credits: promptCredits - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) return { consumed: false, credit_type: null, effective_plan: plan };
      return { consumed: true, credit_type: "plan", effective_plan: plan };
    }

    return { consumed: false, credit_type: null, effective_plan: plan };
  };

  const handleGeneratePrompt = async () => {
    const { data: consumptionRaw, error: cErr } = await supabase.rpc("consume_credit");

    const parsedConsumption = (() => {
      if (typeof consumptionRaw === "boolean") {
        return {
          consumed: consumptionRaw,
          credit_type: "plan" as const,
          effective_plan: effectivePlan,
        };
      }

      if (consumptionRaw && typeof consumptionRaw === "object" && "consumed" in consumptionRaw) {
        const payload = consumptionRaw as {
          consumed?: boolean;
          credit_type?: "avulso" | "plan" | null;
          effective_plan?: PlanTier | null;
        };

        return {
          consumed: Boolean(payload.consumed),
          credit_type: payload.credit_type ?? "plan",
          effective_plan: payload.effective_plan ?? effectivePlan,
        };
      }

      return {
        consumed: false,
        credit_type: null as "avulso" | "plan" | null,
        effective_plan: effectivePlan,
      };
    })();

    let finalConsumption = parsedConsumption;
    if (cErr || !parsedConsumption.consumed) {
      // Compatibilidade para ambientes com função consume_credit legada/inconsistente.
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (!userId) {
        toast.error("Sessão inválida. Faça login novamente.");
        return;
      }

      finalConsumption = await consumeCreditFallbackCompat(userId);
      if (!finalConsumption.consumed) {
        toast.error("Você não tem créditos disponíveis. Faça upgrade para continuar.");
        return;
      }
    }
    await refreshCredits();

    setIsGenerating(true);
    update({ currentStep: 4 });

    try {
      if (!user?.id) {
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      const selectedKeys = getSelectedKeys();
      const imageDescription = state.analysis?.FULL_DESCRIPTION || "";
      const generationPlan = (finalConsumption.effective_plan as PlanTier | null) ?? effectivePlan;

      const generated = await generateFinalPrompt(
        imageDescription,
        selectedKeys,
        generationPlan,
        state.humanization,
        {
          userId: user.id,
          imagePreview: state.imagePreview,
          renderConfig: {
            ...state.renderConfig,
            humanization: state.humanization,
            creditType: finalConsumption.credit_type,
            effectivePlan: generationPlan,
          },
        }
      );

      update({ finalPrompt: generated.prompt });
      setUsedKeys(generated.usedKeys);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao gerar prompt";
      toast.error(message);
      update({ currentStep: 3 });
    } finally {
      setIsGenerating(false);
    }
  };

  
  const handleReset = () => {
    setState(initialState);
    setUsedKeys([]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header 
        credits={credits} 
        onHistoryOpen={() => setHistoryOpen(true)} 
        showStepper={true}
      />

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
            effectivePlan={effectivePlan}
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
            usedKeys={usedKeys}
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
