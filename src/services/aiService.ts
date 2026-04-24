import { ImageAnalysis } from "@/types/promptRender";
import { HUMANIZATION_PROMPT } from "@/config/promptsConfig";
import { supabase } from "@/integrations/supabase/client";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { PlanTier, validateSelectedPromptKeysByPlan } from "@/config/planPermissions";
 
async function getFunctionsErrorMessage(error: unknown, fallbackMessage: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error && typeof body.error === "string") {
        return body.error;
      }
      if (body?.message && typeof body.message === "string") {
        return body.message;
      }
    } catch {
      // No-op: fallback below
    }
 
    return "A função retornou um erro HTTP. Verifique se você está autenticado e se os secrets da Edge Function estão configurados.";
  }
 
  if (error instanceof FunctionsRelayError) {
    return "Falha no relay da Edge Function. Tente novamente em alguns instantes.";
  }
 
  if (error instanceof FunctionsFetchError) {
    return "Falha de rede ao chamar a Edge Function. Verifique sua conexão e tente novamente.";
  }
 
  return fallbackMessage;
}
 
 
// ─────────────────────────────────────────────
// STEP 02 — Analisa a imagem via Edge Function
// ─────────────────────────────────────────────
export async function analyzeImage(base64Image: string): Promise<ImageAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze-image", {
    body: { base64Image },
  });
 
  if (error) {
    console.error("analyze-image error:", error);
    throw new Error(await getFunctionsErrorMessage(error, "Erro ao analisar imagem. Tente novamente."));
  }
 
  if (data?.error) {
    throw new Error(data.error);
  }
 
  return data as ImageAnalysis;
}
 
// ─────────────────────────────────────────────
// STEP 04 — Formata humanização em linguagem técnica
// ─────────────────────────────────────────────
export function formatHumanization(
  pessoas: string,
  animais: string
): string {
  if (!pessoas && !animais) return "";
  return HUMANIZATION_PROMPT(pessoas, animais);
}

export interface GeneratedPromptResult {
  prompt: string;
  usedKeys: string[];
  historyId: string | null;
}
 
// ─────────────────────────────────────────────
// STEP 05 — Gera o prompt final via Edge Function
// ─────────────────────────────────────────────
export async function generateFinalPrompt(
  imageDescription: string,
  selectedKeys: string[],
  effectivePlan: PlanTier,
  humanization: {
    enabled: boolean;
    addPeople: boolean;
    peopleDescription: string;
    addAnimals: boolean;
    animalDescription: string;
  },
  historyContext?: {
    userId: string;
    imagePreview?: string | null;
    renderConfig?: Record<string, unknown>;
  }
): Promise<GeneratedPromptResult> {
  const validation = validateSelectedPromptKeysByPlan(selectedKeys, effectivePlan);
  if (!validation.valid) {
    throw new Error("Algumas opções selecionadas exigem plano Pro. Ajuste as configurações e tente novamente.");
  }
 
  // Build humanization text
  let humanizationText = "";
  if (humanization.enabled) {
    const pessoas = humanization.addPeople ? humanization.peopleDescription.trim() : "";
    const animais = humanization.addAnimals ? humanization.animalDescription.trim() : "";
    if (pessoas || animais) {
      humanizationText = formatHumanization(pessoas, animais);
    }
  }
 
  // Envia as chaves diretamente — a Edge Function resolve os textos internamente
  const { data, error } = await supabase.functions.invoke("generate-prompt", {
    body: { imageDescription, selectedKeys, humanizationText },
  });
 
  if (error) {
    console.error("generate-prompt error:", error);
    throw new Error(await getFunctionsErrorMessage(error, "Erro ao gerar prompt final. Tente novamente."));
  }
 
  if (data?.error) {
    throw new Error(data.error);
  }
 
  const prompt = data?.prompt;
  if (!prompt) throw new Error("Erro ao gerar prompt final. Tente novamente.");
  const usedKeys = Array.isArray(data?.usedKeys)
    ? data.usedKeys.filter((key: unknown) => typeof key === "string")
    : [];

  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
  const { data: historyRow, error: insertError } = await supabase
    .from("prompt_history")
    .insert({
      user_id: historyContext?.userId,
      prompt,
      image_preview: historyContext?.imagePreview || null,
      render_config: historyContext?.renderConfig ?? {},
      word_count: wordCount,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    console.error("prompt_history insert error:", insertError);
    throw new Error("Prompt gerado, mas houve erro ao salvar no histórico.");
  }

  return { prompt, usedKeys, historyId: (historyRow as { id?: string } | null)?.id ?? null };
}
