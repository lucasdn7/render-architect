import { ImageAnalysis } from "@/types/promptRender";
import { RENDER_PROMPTS, HUMANIZATION_PROMPT, SYSTEM_PERSONA } from "@/config/promptsConfig";
 
// ─────────────────────────────────────────────
// CONFIGURAÇÃO COMETAI
// Substitua SUA_CHAVE_AQUI pela sua API Key do CometAI
// ─────────────────────────────────────────────
const API_KEY = "sk-vVyFFZjqREWVvtSQ1PHTrA4qgPhsKOYB29n0XmQvDiGEP9PA";
const API_URL = "https://api.cometapi.com/v1/chat/completions";
const MODEL_VISION = "gpt-4o";       // usado no Step 02 — análise de imagem
const MODEL_TEXT   = "gpt-4o-mini";  // usado nos Steps 04 e 05 — texto
 
// ─────────────────────────────────────────────
// STEP 02 — Analisa a imagem enviada pelo usuário
// ─────────────────────────────────────────────
export async function analyzeImage(base64Image: string): Promise<ImageAnalysis> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_VISION,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: SYSTEM_PERSONA,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: `As an expert architect and AI prompt specialist, analyze this architectural image in extreme technical detail.
Return ONLY a valid JSON object with these exact fields, no extra text, no markdown, no explanation:
{
  "image_type": "type of image (3D render, real photo, SketchUp print, floor plan, sketch...)",
  "architectural_style": "precise architectural style identified",
  "environment": "interior, exterior or mixed",
  "materials": "all identified materials with technical names",
  "objects": "all objects, furniture, vegetation, decorative elements present",
  "lighting": "lighting type, direction, quality and apparent time of day",
  "colors": "dominant color palette with descriptive names",
  "textures": "all surface textures identified",
  "spatial_composition": "perspective type, camera angle, depth and framing",
  "architectural_details": "specific architectural elements: roof, windows, facades, structural details",
  "atmosphere": "overall mood and atmosphere of the image",
  "full_description": "A single cohesive paragraph of 4-6 lines describing all elements above as a professional architectural render prompt in English"
}`,
            },
          ],
        },
      ],
    }),
  });
 
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`CometAI error ${response.status}: ${err}`);
  }
 
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
 
  if (!content) throw new Error("Resposta vazia da IA. Tente novamente.");
 
  try {
    // Remove possíveis blocos ```json ``` caso a IA retorne mesmo assim
    const clean = content.replace(/```json|```/g, "").trim();
    return JSON.parse(clean) as ImageAnalysis;
  } catch {
    throw new Error("Erro ao interpretar análise da imagem. Tente novamente.");
  }
}
 
// ─────────────────────────────────────────────
// STEP 04 — Formata o texto de humanização em
// linguagem técnica de prompt para IA de imagem
// ─────────────────────────────────────────────
export async function formatHumanization(
  pessoas: string,
  animais: string
): Promise<string> {
  if (!pessoas && !animais) return "";
 
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_TEXT,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content: SYSTEM_PERSONA,
        },
        {
          role: "user",
          content: `Convert the humanization description below into optimized English prompt language for Midjourney and DALL-E architectural renders.
Return ONLY the prompt text, no explanation, no preamble.
 
${pessoas ? `People to add: ${pessoas}` : ""}
${animais ? `Animals to add: ${animais}` : ""}`,
        },
      ],
    }),
  });
 
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`CometAI error ${response.status}: ${err}`);
  }
 
  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
 
// ─────────────────────────────────────────────
// STEP 05 — Monta e refina o prompt final
// ─────────────────────────────────────────────
export async function generateFinalPrompt(
  imageDescription: string,
  selectedKeys: string[],
  humanization: {
    enabled: boolean;
    addPeople: boolean;
    peopleDescription: string;
    addAnimals: boolean;
    animalDescription: string;
  }
): Promise<string> {
  // Busca os prompts ocultos das seleções do usuário
  const selectedPrompts = selectedKeys
    .map((key) => RENDER_PROMPTS[key])
    .filter(Boolean);
 
  // Sempre adiciona o sufixo técnico
  selectedPrompts.push(RENDER_PROMPTS.suffix);
 
  // Monta o bloco de humanização se habilitado
  let humanizationText = "";
  if (humanization.enabled) {
    const pessoas = humanization.addPeople
      ? humanization.peopleDescription.trim()
      : "";
    const animais = humanization.addAnimals
      ? humanization.animalDescription.trim()
      : "";
    if (pessoas || animais) {
      // Opção 1: formata via IA para linguagem técnica
      humanizationText = await formatHumanization(pessoas, animais);
      // Fallback: se IA falhar, usa o template direto
      if (!humanizationText) {
        humanizationText = HUMANIZATION_PROMPT(pessoas, animais);
      }
    }
  }
 
  // Chama a IA para unir e refinar tudo em um prompt coeso
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_TEXT,
      max_tokens: 800,
      messages: [
        {
          role: "system",
          content: SYSTEM_PERSONA,
        },
        {
          role: "user",
          content: `You are assembling the final prompt for a photorealistic architectural render.
Combine the blocks below into ONE single cohesive prompt in English.
Remove all redundancies, resolve contradictions, ensure perfect technical flow.
Return ONLY the final prompt text. No explanation, no preamble, no markdown.
 
## IMAGE DESCRIPTION:
${imageDescription}
 
## RENDER CONFIGURATIONS:
${selectedPrompts.join(", ")}
 
${humanizationText ? `## HUMANIZATION:\n${humanizationText}` : ""}
 
Rules:
- Single continuous text, comma-separated technical terms
- Most important architectural elements first
- Maintain all fidelity rules from the original prompts (do not alter textures, format or original project)
- End with technical render parameters
- Maximum 250 words`,
        },
      ],
    }),
  });
 
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`CometAI error ${response.status}: ${err}`);
  }
 
  const data = await response.json();
  const prompt = data.choices?.[0]?.message?.content?.trim();
 
  if (!prompt) throw new Error("Erro ao gerar prompt final. Tente novamente.");
 
  return prompt;
}
