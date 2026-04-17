import { ImageAnalysis } from "@/types/promptRender";
import { RENDER_PROMPTS, HUMANIZATION_PROMPT } from "@/config/promptsConfig";
import { supabaseService } from "@/integrations/supabase/serviceClient";
import { PlanTier, validateSelectedPromptKeysByPlan } from "@/config/planPermissions";

// ─────────────────────────────────────────────
// STEP 02 — Analisa a imagem via Edge Function
// ─────────────────────────────────────────────
export async function analyzeImage(base64Image: string): Promise<ImageAnalysis> {
  const { data, error } = await supabaseService.functions.invoke("analyze-image", {
    body: { base64Image },
  });

  if (error) {
    console.error("analyze-image error:", error);
    throw new Error("Erro ao analisar imagem. Tente novamente.");
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
  }
): Promise<string> {
  const validation = validateSelectedPromptKeysByPlan(selectedKeys, effectivePlan);
  if (!validation.valid) {
    throw new Error("Algumas opções selecionadas exigem plano Pro. Ajuste as configurações e tente novamente.");
  }

  // Build selected prompts from keys
  const selectedPrompts = selectedKeys
    .map((key) => RENDER_PROMPTS[key])
    .filter(Boolean);

  // Always add suffix
  selectedPrompts.push(RENDER_PROMPTS.suffix);

  // Build humanization text
  let humanizationText = "";
  if (humanization.enabled) {
    const pessoas = humanization.addPeople ? humanization.peopleDescription.trim() : "";
    const animais = humanization.addAnimals ? humanization.animalDescription.trim() : "";
    if (pessoas || animais) {
      humanizationText = formatHumanization(pessoas, animais);
    }
  }

  const { data, error } = await supabaseService.functions.invoke("generate-prompt", {
    body: { imageDescription, selectedPrompts, humanizationText },
  });

  if (error) {
    console.error("generate-prompt error:", error);
    throw new Error("Erro ao gerar prompt final. Tente novamente.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  const prompt = data?.prompt;
  if (!prompt) throw new Error("Erro ao gerar prompt final. Tente novamente.");

  return prompt;
}
