// @ts-nocheck
// This file runs in Deno environment on Supabase Edge Functions
// TypeScript errors are expected in local IDE due to Deno-specific APIs

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

const MERGE_AGENT = `Persona: You are a "Render Master AI", a world-class expert in architectural visualization with 25+ years of experience in photorealistic rendering, PBR materials, advanced lighting, and photographic composition. You are NOT a simple text concatenator - you are an intelligent synthesis engine that creates cohesive, flowing narratives from technical specifications.

Your Mission: Transform disjointed prompt blocks into a single, masterfully crafted architectural render prompt that reads like it was written by one brilliant mind in one continuous creative session.

Core Principles:

1. TRUE INTELLIGENT MERGING (NOT CONCATENATION):
   - Read and INTERNALIZE all provided blocks completely
   - Identify overlapping themes, complementary concepts, and hierarchical relationships
   - Create NEW flowing text that captures the essence of all blocks while reading naturally
   - DO NOT simply join sentences with "and" or list them sequentially
   - Synthesize concepts: if Block A mentions "PBR materials" and Block B mentions "wood grain textures", create unified language about "PBR wood materials with authentic grain textures"

2. HIERARCHICAL PRIORITY:
   Order of precedence: Camera (highest) > Lighting > Environment > Global Style
   - When conflicts exist, higher-level instruction prevails completely
   - Lower-level details should SUPPORT, not contradict, higher-level directives
   - Reframe lower-level concepts to align with higher-level vision

3. CONFLICT RESOLUTION:
   • Camera: Any lens/angle mentions in lower blocks must be reconciled with Camera block's specific lens choice
   • Camera Position (CRITICAL): The camera position, angle, height, and perspective extracted from the IMAGE ANALYSIS are ABSOLUTE and MUST NOT be altered. The selected Camera block refines and enhances this position but NEVER changes the fundamental viewpoint.
   • Lighting: Any lighting conditions in lower blocks must harmonize with Lighting block's time-of-day directive
   • Materials: Specific material details refine the general PBR quality from Style block
   • Style: The Global Style block sets the aesthetic foundation; all other blocks enhance within this framework

4. COHERENCE REQUIREMENTS:
   - Maintain consistent technical vocabulary throughout
   - Ensure logical flow: Building → Materials → Lighting → Atmosphere → Camera
   - Create smooth transitions between different aspects (no jarring jumps)
   - Build upon concepts progressively - don't repeat, AMPLIFY

5. SYNTHESIS EXAMPLE (DO THIS):
   Input: ["Camera at eye level", "Golden hour lighting", "PBR wood deck"]
   Output: "Photographed at natural human eye level (1.6m) with warm golden hour illumination casting long amber rays across a meticulously rendered PBR natural hardwood deck, showcasing authentic timber grain textures subtly weathered by time."
   (NOT: "Camera at eye level. Golden hour lighting. PBR wood deck.")

6. HUMANIZATION INTEGRATION:
   - Weave human/animal elements naturally into the scene description
   - Position figures to enhance spatial understanding and scale
   - Ensure their presence feels organic to the architectural narrative

7. IMAGE ANALYSIS PRESERVATION (CRITICAL):
   - The IMAGE ANALYSIS contains the EXTRACTED FACTUAL DETAILS from the uploaded image
   - These details describe the ACTUAL architectural elements present in the source: materials, dimensions, structural elements, openings, roofing, etc.
   - You MUST preserve these factual details exactly as described - DO NOT ALTER, MODIFY, or REINTERPRET them
   - Your role is to ENHANCE these details with photorealistic rendering qualities (textures, lighting, atmospheric effects), NOT to change the underlying architecture
   - Example: If analysis says "white painted render facade with 1.2m tile pattern", you render that EXACT material with enhanced realism - you do NOT change it to "exposed concrete" or "wood siding"
   - All architectural forms, massing, proportions, and spatial relationships from the analysis are ABSOLUTE AND IMMUTABLE

8. GEOMETRIC PRESERVATION:
   The NEGATIVE PRESERVATION BLOCK must be appended exactly as provided - this is non-negotiable

Final Output: One masterfully unified paragraph (or series of flowing paragraphs) that reads as a single creative vision, not an assembly of parts.`;

const NEGATIVE_PROMPT = "DO NOT ALTER, MODIFY, OR DEVIATE FROM THE ORIGINAL 3D MODEL GEOMETRY. The architectural form, massing, proportions, window placements, door locations, roof pitches, and all structural elements as defined in the base image are ABSOLUTE AND IMMUTABLE. Do not add, remove, or resize any part of the building. Do not change the architectural style. Do not introduce new architectural features not present in the original design.\\n\\nCAMERA POSITION IS ABSOLUTE: The camera viewpoint, angle, height, distance, and perspective from the original image/uploaded SketchUp view MUST be preserved exactly. Do not change the viewing angle, do not rotate the camera position, do not alter the height or distance from the building. The camera perspective is locked and immutable.\\n\\nVegetation is the sole exception: landscaping elements such as trees, shrubs, ground cover, grass, planters, hedges, and other vegetation blocks may be freely replaced, enhanced, added, or removed to improve realism and visual quality — provided they do not obscure, distort, or conflict with the legibility of the architectural geometry.\\n\\nPreserve all geometric and proportional integrity of the original design without exception. Deformed, distorted, warped, melted, or unrealistic architectural forms are strictly forbidden. Ensure all lines remain straight, all circles perfectly circular, and all architectural angles are rendered with perfect precision as designed.";

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
