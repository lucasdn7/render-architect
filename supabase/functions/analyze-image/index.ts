// @ts-nocheck
// This file runs in Deno environment on Supabase Edge Functions
// TypeScript errors are expected in local IDE due to Deno-specific APIs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PERSONA = `You are a senior architect, urbanist, and interior designer with 20 years of experience, specialized in generating photorealistic AI image prompts for architectural renders. You have deep knowledge of 3D rendering, lighting techniques, materials, spatial composition, and photographic principles. You always write prompts in English, highly technical, optimized for Midjourney, DALL-E 3, and Adobe Firefly.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base64Image } = await req.json();
    if (!base64Image) {
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
          { role: "system", content: SYSTEM_PERSONA },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: base64Image },
              },
              {
                type: "text",
                text: `As a forensic architectural analyst with 25+ years of experience, conduct a COMPREHENSIVE and EXHAUSTIVE analysis of every single detail visible in this architectural image. NOTHING should escape your observation. Return ONLY a valid JSON object with these fields - each field must contain EXTREMELY detailed information:

{
  "IMAGE_TYPE": "precise classification (photorealistic 3D render, architectural photography, concept sketch, technical drawing, floor plan, elevation, section, axonometric, perspective)",
  "ARCHITECTURAL_STYLE": "detailed style with era, movement, influences, and regional variations",
  "ENVIRONMENT": "exact spatial context with all visible surroundings",
  "BUILDING_TYPE": "specific building classification (single-family home, apartment, office, retail, institutional, industrial, mixed-use, etc.)",
  "STRUCTURAL_SYSTEM": "visible structural elements - foundation type, framing system, load-bearing walls, columns, beams, trusses, cantilevers, setbacks",
  "FACADE": "comprehensive facade description - cladding materials, panel systems, fenestration patterns, reveals, shadow lines, surface treatments",
  "OPENINGS": "ALL doors and windows - exact types (casement, sliding, fixed, pivot, bi-fold, French), frame materials, glazing types, mullion patterns, head/jamb/sill details, hardware",
  "ROOFING": "complete roof description - form (flat, pitched, gable, hip, mansard, shed, butterfly), covering materials, eaves, soffits, fascia, gutters, downspouts, parapets, roof penetrations",
  "VERTICAL_CIRCULATION": "stairs, elevators, ramps, escalators - type, materials, railings, balustrades",
  "HORIZONTAL_CIRCULATION": "corridors, hallways, foyers, vestibules - dimensions, finishes, ceiling treatments",
  "ROOMS_SPACES": "identify each distinct room/space by function, approximate dimensions, ceiling height, floor treatment",
  "MATERIALS": "granular material list with exact specifications (e.g., 'exposed concrete with 1.2m formwork tie pattern', 'white Carrara marble with grey veining', 'clear tempered glass with low-iron content')",
  "FINISHES": "surface treatments - paint colors (with hex codes if identifiable), stains, clear coats, patinas, weathering, wear patterns",
  "OBJECTS": "complete inventory of EVERY visible object - furniture (identify designer/brand if possible), lighting fixtures (exact type: pendant/chandelier/recessed/track/wall/ceiling/floor), decorative elements, accessories, equipment",
  "VEGETATION": "ALL plants visible - species identification if possible, maturity, density, placement, container types, health condition",
  "VEHICLES": "any vehicles visible - type, make/model if identifiable, color, condition, positioning",
  "PEOPLE": "human presence - number, activities, clothing styles, approximate ages, groupings",
  "LIGHTING": "detailed lighting analysis - all natural and artificial sources, time of day estimation, shadow directions, light color temperature, intensity, contrast ratios, reflection patterns, glare sources",
  "COLORS": "exhaustive color analysis - primary palette, secondary colors, accent colors, neutrals, color harmony scheme, saturation levels, with approximate color names",
  "TEXTURES": "surface texture catalog - every visible material's surface quality, glossiness, roughness, pattern, irregularities, imperfections",
  "PATTERNS": "geometric patterns, repetitive elements, grids, modules, tessellations, ornamental details",
  "SPATIAL_COMPOSITION": "comprehensive composition analysis - exact camera position estimation, lens focal length approximation, perspective type, vanishing points, foreground/midground/background elements, depth layers",
  "ARCHITECTURAL_DETAILS": "catalog of ALL architectural details - baseboards, crown moldings, reveals, expansion joints, control joints, weep holes, vents, louvers, screens, louvers, shutters, awnings, canopies, balconies, terraces",
  "MECHANICAL_ELECTRICAL": "visible MEP elements - HVAC units, ductwork, diffusers, switches, outlets, panels, meters, conduits, lighting controls",
  "LANDSCAPE": "site features - paving materials (exact patterns, joint widths), drainage, irrigation, edging, planters, grade changes",
  "ATMOSPHERE": "detailed mood and emotional impact - ambiance, character, experience, cultural context, seasonal indicators, weather conditions",
  "WEATHER_CONDITIONS": "current weather state - sky conditions, cloud types, precipitation, wind effects, atmospheric clarity",
  "PHOTOGRAPHIC_QUALITIES": "image characteristics - focus, sharpness, depth of field, motion blur, lens distortion, chromatic aberration, film grain, dynamic range",
  "SIGNS_TEXT": "any visible signage, text, numbers, symbols, logos - content, typography, placement",
  "DAMAGES_IMPERFECTIONS": "any flaws, defects, deterioration, damage, repairs, stains, cracks, chips, fading, discoloration",
  "TEMPORAL_INDICATORS": "clues about time period - architectural era, style period, construction date indicators, vintage vs. contemporary elements",
  "SCALE_REFERENCES": "any scale indicators - human figures, vehicles, furniture, standard objects that indicate dimensions",
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: An exceptionally detailed, flowing narrative description (15-20 lines) that captures EVERY nuance of the architectural scene. Describe the building/space as if to a blind architect who needs to visualize it perfectly. Include: overall impression, massing, proportions, material relationships, spatial qualities, light behavior, atmospheric conditions, and ALL distinguishing characteristics. This should be the ultimate architectural visualization prompt."
}

CRITICAL INSTRUCTIONS:
- Examine the image as if your career depends on catching every detail
- Describe materials with enough specificity that a contractor could identify them
- Note the condition and wear of every surface
- Identify patterns at macro and micro scales
- Capture the interplay between materials, light, and shadow
- Describe spatial sequences and how spaces connect
- Note any asymmetries, irregularities, or unique features
- Identify the designer's/architect's intent through design decisions
- Return ONLY the JSON object. No markdown, no explanations, no extra text.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 401) {
        return new Response(JSON.stringify({ error: "Chave da OpenAI inválida ou não configurada corretamente." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const errorText = await response.text();
      console.error("OpenAI error:", status, errorText);
      throw new Error(`OpenAI error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const analysis = JSON.parse(jsonStr);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro ao analisar imagem" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
