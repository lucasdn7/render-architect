import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MASTER_MERGE_PROMPT = `As an expert AI prompt meshing system for architectural visualization, your task is to combine selected prompt blocks into a single, coherent, and highly effective rendering prompt. Follow this strict hierarchical order and conflict resolution strategy:

How your AI meshing system should operate:
• It must concatenate the texts of the blocks in hierarchical order (1 -> 2 -> 3 -> 4 -> 5 -> 6).
• In case of direct conflict, the instruction from the higher-level block always prevails (e.g., the lens defined in the "Camera Perspective" block has priority over a lens mention in an "Lighting" block).
• Repeated terms (like "hyper-realistic") should be consolidated or have their weight increased, not interpreted as contradictory.

This structure ensures that every aspect of the rendering is controlled precisely and that the final prompt is robust, technically coherent, and capable of generating photorealistic images of the highest quality, fully respecting the original SketchUp design.`;

const MERGE_AGENT = `Persona: You are a "Render Master AI", an expert in architectural visualization with deep knowledge in photorealistic rendering, PBR materials, advanced lighting, and photographic composition. Your mission is to interpret and combine the provided prompt blocks to generate a final cohesive and technically optimized prompt for state-of-the-art rendering engines.

Operation Logic:

1. Hierarchical Priority: Always prioritize instructions from higher-level blocks over lower-level ones in case of direct conflict. The order of blocks is: Camera > Lighting > Environment > Global Style.

2. Intelligent Merging: Concatenate the prompts fluidly, ensuring the language is natural and technically precise. Avoid unnecessary repetitions, but reinforce key terms (e.g., PBR, ray-traced) when appropriate.

3. Conflict Resolution:
• Camera: If a style or environment block suggests a lens or angle that contradicts the selected Camera block, the Camera block prevails.
• Lighting: If an environment or style block suggests a lighting condition that contradicts the selected Lighting block, the Lighting block prevails.
• PBR Materials: Instructions for PBR materials in environment blocks should be considered detailed refinements and integrated, as long as they don't contradict the overall PBR quality.

4. Geometric Preservation: The "NEGATIVE PRESERVATION BLOCK" is absolute and must be appended at the end without modifications.

5. Flexibility: Allow selection of up to two "Environment" blocks and merge them harmoniously.

6. Final Output: The result must be a single text prompt, ready for an AI image generator, optimized for photorealism and architectural precision.`;

const NEGATIVE_PROMPT = "DO NOT ALTER, MODIFY, OR DEVIATE FROM THE ORIGINAL 3D MODEL GEOMETRY. The architectural form, massing, proportions, window placements, door locations, roof pitches, and all structural elements as defined in the base image are ABSOLUTE AND IMMUTABLE. Do not add, remove, or resize any part of the building. Do not change the architectural style. Do not introduce new architectural features not present in the original design. The AI's role is strictly limited to applying photorealistic textures, lighting, atmospheric effects, and vegetation enhancements to the existing, unchanged geometry.\\n\\nVegetation is the sole exception: landscaping elements such as trees, shrubs, ground cover, grass, planters, hedges, and other vegetation blocks may be freely replaced, enhanced, added, or removed to improve realism and visual quality — provided they do not obscure, distort, or conflict with the legibility of the architectural geometry.\\n\\nPreserve all geometric and proportional integrity of the original design without exception. Deformed, distorted, warped, melted, or unrealistic architectural forms are strictly forbidden. Ensure all lines remain straight, all circles perfectly circular, and all architectural angles are rendered with perfect precision as designed.";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageDescription, selectedPrompts, humanizationText } = await req.json();

    const API_KEY = Deno.env.get("COMET_API_KEY") || Deno.env.get("OPENAI_API_KEY") || "test-key-replace-with-real-key";
    const API_MODEL = Deno.env.get("COMET_MODEL") || Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    const API_BASE_URL = Deno.env.get("COMET_API_URL") || "https://api.cometapi.com";

    if (!API_KEY || API_KEY === "test-key-replace-with-real-key") {
      return new Response(JSON.stringify({ 
        error: "API_KEY não configurada. Adicione sua chave da API (CometAPI ou OpenAI) nas variáveis de ambiente do Supabase." 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: API_MODEL,
        messages: [
          { role: "system", content: MERGE_AGENT },
          {
            role: "user",
            content: `${MASTER_MERGE_PROMPT}

You are a master prompt engineer creating the ultimate photorealistic architectural render prompt. Synthesize all information below into a comprehensive, detailed, and technically precise prompt following the hierarchical merging rules above.

## IMAGE ANALYSIS:
${imageDescription}

## RENDER ENHANCEMENT BLOCKS (merge in order: Camera > Lighting > Environment > Style):
${Array.isArray(selectedPrompts) ? selectedPrompts.join("\n\n") : selectedPrompts}

${humanizationText ? `## HUMAN ELEMENTS:\n${humanizationText}` : ""}

## MERGING RULES:
1. Concatenate blocks in hierarchical order (Camera > Lighting > Environment > Style)
2. In case of conflict, higher-level block prevails
3. Consolidate repeated terms, increase their weight instead of treating as contradictory
4. Ensure fluid, natural language that is technically precise
5. Include specific materials, lighting techniques, and atmospheric conditions
6. Add camera angles, lens specifications, and render engine details
7. No character limits - prioritize quality over brevity

## CRITICAL FINAL STEP:
After generating the complete merged prompt, you MUST append the following NEGATIVE PRESERVATION BLOCK exactly as written, without any modifications:

--- NEGATIVE PROMPT ---
${NEGATIVE_PROMPT}

Create a masterpiece prompt that will produce stunning, photorealistic architectural renders with incredible detail, artistic vision, and ABSOLUTE geometric preservation of the original 3D model.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 401) {
        return new Response(JSON.stringify({ error: "Chave da API inválida ou não configurada corretamente." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const errorText = await response.text();
      console.error("API error:", status, errorText);
      throw new Error(`API error: ${status}`);
    }

    const data = await response.json();
    const prompt = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ prompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro ao gerar prompt" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
