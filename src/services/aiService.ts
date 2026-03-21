import { supabase } from "@/integrations/supabase/client";
import { ImageAnalysis } from "@/types/promptRender";
import { RENDER_PROMPTS, HUMANIZATION_PROMPT } from "@/config/promptsConfig";

export async function analyzeImage(base64Image: string): Promise<ImageAnalysis> {
  const { data, error } = await supabase.functions.invoke('analyze-image', {
    body: { base64Image },
  });

  if (error) throw new Error(error.message || 'Erro ao analisar imagem');
  if (data.error) throw new Error(data.error);
  return data as ImageAnalysis;
}

export async function generateFinalPrompt(
  imageDescription: string,
  selectedKeys: string[],
  humanization: { enabled: boolean; addPeople: boolean; peopleDescription: string; addAnimals: boolean; animalDescription: string }
): Promise<string> {
  const selectedPrompts = selectedKeys
    .map((key) => RENDER_PROMPTS[key])
    .filter(Boolean);

  // Add the technical suffix
  selectedPrompts.push(RENDER_PROMPTS.suffix);

  let humanizationText = '';
  if (humanization.enabled) {
    const pessoas = humanization.addPeople ? humanization.peopleDescription.trim() : '';
    const animais = humanization.addAnimals ? humanization.animalDescription.trim() : '';
    if (pessoas || animais) {
      humanizationText = HUMANIZATION_PROMPT(pessoas, animais);
    }
  }

  const { data, error } = await supabase.functions.invoke('generate-prompt', {
    body: { imageDescription, selectedPrompts, humanizationText },
  });

  if (error) throw new Error(error.message || 'Erro ao gerar prompt');
  if (data.error) throw new Error(data.error);
  return data.prompt;
}
