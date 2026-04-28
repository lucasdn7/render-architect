// @ts-nocheck
// This file runs in Deno environment on Supabase Edge Functions
// TypeScript errors are expected in local IDE due to Deno-specific APIs
 
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
 
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
 
const SYSTEM_PERSONA = `You are an elite forensic architectural analyst with 30 years of experience across architectural design, technical documentation, and photorealistic rendering. You possess expert-level reading ability for ALL types of architectural representations: photorealistic 3D renders, on-site photography, 2D floor plans, sections, elevations, axonometric drawings, site plans, construction details, and concept sketches.
 
When analyzing 2D technical drawings (floor plans, sections, elevations), you read them with the precision of a licensed architect: you identify every room by its label or inferred function, read all dimension annotations, interpret hatching patterns as specific materials, recognize standard architectural symbols for doors/windows/stairs/fixtures/furniture, and understand spatial relationships between elements. You extract EVERY piece of information visible in the drawing — no label, dimension, room, wall, opening, furniture block, or notation is overlooked.
 
You always write analysis in English, with extreme technical precision.`;
 
// ─── Unified classify + analyze prompt ───────────────────────────────────────
const UNIFIED_PROMPT = `First, classify this image into exactly one of: RENDER_3D, PHOTO, FLOOR_PLAN, SECTION, ELEVATION, SITE_PLAN, AXONOMETRIC, DETAIL_DRAWING, CONCEPT_SKETCH, MIXED.
 
Then conduct a COMPREHENSIVE and EXHAUSTIVE analysis based on the detected type. Return ONLY a valid JSON object with the IMAGE_TYPE field plus ALL applicable fields from the schema that matches the image:
 
--- FOR RENDER_3D / PHOTO / AXONOMETRIC / CONCEPT_SKETCH / MIXED ---
{
  "IMAGE_TYPE": "precise classification",
  "ARCHITECTURAL_STYLE": "detailed style with era, movement, influences, and regional variations",
  "ENVIRONMENT": "exact spatial context with all visible surroundings",
  "BUILDING_TYPE": "specific building classification",
  "STRUCTURAL_SYSTEM": "visible structural elements — foundation type, framing, load-bearing walls, columns, beams, trusses, cantilevers",
  "FACADE": "comprehensive facade — cladding materials, panel systems, fenestration patterns, reveals, shadow lines, surface treatments",
  "OPENINGS": "ALL doors and windows — exact types, frame materials, glazing, mullion patterns, hardware",
  "ROOFING": "complete roof — form, covering materials, eaves, soffits, fascia, gutters, parapets, penetrations",
  "VERTICAL_CIRCULATION": "stairs, elevators, ramps — type, materials, railings, balustrades",
  "HORIZONTAL_CIRCULATION": "corridors, foyers, vestibules — dimensions, finishes, ceiling treatments",
  "ROOMS_SPACES": "each distinct room/space — function, approximate dimensions, ceiling height, floor treatment",
  "MATERIALS": "granular material list with exact specifications",
  "FINISHES": "surface treatments — paint colors with hex codes if identifiable, stains, patinas, weathering",
  "OBJECTS": "complete inventory of EVERY visible object — furniture (designer/brand if possible), lighting fixtures (exact type), decorative elements, accessories, equipment",
  "VEGETATION": "ALL plants — species if possible, maturity, density, placement, containers, health condition",
  "VEHICLES": "any vehicles — type, make/model if identifiable, color, condition, positioning",
  "PEOPLE": "human presence — number, activities, clothing, approximate ages, groupings",
  "LIGHTING": "ALL natural and artificial sources — time of day, shadow directions, color temperature, intensity, contrast, reflections, glare",
  "COLORS": "exhaustive palette — primary, secondary, accent, neutrals, harmony scheme, saturation, approximate color names",
  "TEXTURES": "surface texture catalog — every material's glossiness, roughness, pattern, irregularities, imperfections",
  "PATTERNS": "geometric patterns, repetitive elements, grids, modules, tessellations, ornamental details",
  "SPATIAL_COMPOSITION": "camera position, focal length, perspective type, vanishing points, foreground/midground/background layers",
  "ARCHITECTURAL_DETAILS": "ALL details — baseboards, moldings, reveals, joints, vents, louvers, awnings, canopies, balconies",
  "MECHANICAL_ELECTRICAL": "visible MEP — HVAC, ductwork, diffusers, switches, outlets, conduits, controls",
  "LANDSCAPE": "paving materials and patterns, drainage, irrigation, edging, planters, grade changes",
  "ATMOSPHERE": "mood, ambiance, character, cultural context, seasonal indicators, weather",
  "WEATHER_CONDITIONS": "sky, clouds, precipitation, wind effects, atmospheric clarity",
  "PHOTOGRAPHIC_QUALITIES": "focus, sharpness, depth of field, motion blur, lens distortion, grain, dynamic range",
  "SIGNS_TEXT": "any visible signage, text, numbers, symbols, logos — content, typography, placement",
  "DAMAGES_IMPERFECTIONS": "flaws, defects, deterioration, stains, cracks, chips, fading",
  "TEMPORAL_INDICATORS": "clues about time period — style era, construction date indicators",
  "SCALE_REFERENCES": "scale indicators — human figures, vehicles, furniture, standard objects",
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: An exceptionally detailed flowing narrative (15-20 lines) capturing EVERY nuance — overall impression, massing, proportions, material relationships, spatial qualities, light behavior, atmosphere, and ALL distinguishing characteristics.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from the analysis above, written in English, optimized for photorealistic architectural rendering, 3-5 lines, capturing style, materials, lighting, atmosphere, camera angle, and all key architectural features."
}
 
--- FOR FLOOR_PLAN / SITE_PLAN ---
{
  "IMAGE_TYPE": "Floor Plan or Site Plan — specify which, and floor level if applicable",
  "DRAWING_SCALE": "scale indicated in the drawing (e.g., 1:50, 1:100) or estimated from dimensions",
  "NORTH_ORIENTATION": "north arrow direction if present, or inferred orientation",
  "LOT_GEOMETRY": "lot/plot shape, approximate overall dimensions, setbacks, boundaries, street frontage",
  "TOTAL_BUILT_AREA": "approximate total built area in m² based on visible dimensions",
  "ROOMS_INVENTORY": [
    {
      "name": "room label as written in plan or inferred function",
      "area_m2": "area if annotated or estimated",
      "dimensions": "width x length if readable",
      "ceiling_height": "if annotated",
      "floor_finish": "if indicated by hatching or annotation",
      "notes": "any additional annotations or observations about this room"
    }
  ],
  "ROOM_COUNT_SUMMARY": "total count by type: X bedrooms, X bathrooms, X living areas, X service areas, etc.",
  "SPATIAL_ZONING": "how the plan is organized — social zone, private zone, service zone, circulation zone — which rooms belong to each",
  "CIRCULATION": "description of all internal circulation paths — corridors, hallways, transition spaces, how zones connect",
  "VERTICAL_CIRCULATION": "stairs (type: straight/L/U/spiral, number of risers if readable), elevators, ramps — exact position in plan",
  "WALLS": "wall types visible — load-bearing (thick solid), partition (thin), glass walls, curved walls — materials if indicated by hatching",
  "WALL_THICKNESS": "typical wall thicknesses as readable from dimensions or scale",
  "DOORS": [
    {
      "type": "swing/sliding/bi-fold/double/pocket",
      "location": "which room or transition it serves",
      "swing_direction": "as shown in plan symbol",
      "approximate_width": "if readable"
    }
  ],
  "WINDOWS": [
    {
      "type": "fixed/casement/sliding/bay/corner/full-height",
      "location": "which room and which wall face",
      "approximate_width": "if readable",
      "notes": "any special feature — corner window, floor-to-ceiling, etc."
    }
  ],
  "FURNITURE_INVENTORY": "COMPLETE list of ALL furniture blocks visible — specify room, piece type, approximate size, arrangement",
  "KITCHEN_DETAILS": "kitchen layout type (L/U/galley/island/peninsula), all visible appliances and fixtures",
  "BATHROOM_DETAILS": "for EACH bathroom — fixtures present (toilet, bidet, bathtub, shower, sink count, vanity), layout, approximate dimensions",
  "SERVICE_AREAS": "laundry room, utility room, storage — equipment visible, dimensions",
  "GARAGE": "number of car spaces, dimensions, access type, gate type, floor finish annotation",
  "OUTDOOR_AREAS": "terraces, balconies, decks, patios — dimensions if annotated, furniture shown, orientation relative to interior",
  "POOL_SPA": "pool/spa presence — shape, approximate dimensions, coping, deck area, equipment room location",
  "GARDEN_LANDSCAPE": "garden areas, planting beds, trees shown in plan, paving patterns, pathways",
  "DIMENSIONS_ANNOTATIONS": "ALL visible dimension strings — list key overall dimensions and room-specific dimensions exactly as written",
  "SECTION_CUT_INDICATORS": "any section cut lines, elevation markers, or detail callouts visible in the plan",
  "STRUCTURAL_GRID": "column grid if visible — spacing, column sizes",
  "MEP_ELEMENTS": "any mechanical/electrical/plumbing elements shown — drain points, electrical panels, HVAC units, duct routes",
  "HATCHING_MATERIALS": "interpretation of all hatching patterns used — what materials they represent",
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: An exceptionally detailed flowing narrative (15-20 lines) capturing EVERY spatial and technical nuance of the floor plan — layout logic, zoning, circulation flow, room relationships, furniture arrangement, and all distinguishing architectural features.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from the plan analysis, written in English, optimized for photorealistic architectural rendering, 3-5 lines, capturing layout, materials, lighting, atmosphere, camera angle, and all key architectural features."
}
 
--- FOR SECTION / ELEVATION / DETAIL_DRAWING ---
{
  "IMAGE_TYPE": "Section or Elevation — specify which, and provide orientation (e.g., North Elevation, Section A-A)",
  "DRAWING_SCALE": "scale indicated in the drawing or estimated from dimensions",
  "TOTAL_HEIGHT": "total building height from grade to highest point as annotated",
  "FLOOR_TO_FLOOR_HEIGHTS": "list all floor-to-floor or floor-to-ceiling heights as annotated",
  "FACADE_COMPOSITION": "for elevations — detailed description of facade materials, cladding, fenestration, patterns, and ornamental details",
  "INTERNAL_SPACES": "for sections — list all rooms/spaces cut through, their functions, and spatial relationships",
  "STRUCTURAL_ELEMENTS": "foundations, slabs, walls, columns, beams, roof structure — materials and thicknesses as annotated or hatched",
  "OPENINGS": "doors and windows visible — types, materials, dimensions if annotated",
  "VERTICAL_CIRCULATION": "stairs, elevators, ramps shown in section — type, number of risers, materials",
  "ROOF_DETAILS": "roof form, pitch, materials, eaves, parapets, drainage details",
  "GROUND_RELATIONSHIP": "how the building meets the ground — grade levels, foundations, basement, landscaping at grade",
  "MATERIALS_FINISHES": "all materials indicated by hatching or annotations — specify for facade, structure, and internal finishes",
  "DIMENSIONS_ANNOTATIONS": "ALL visible dimension strings — list key vertical and horizontal dimensions exactly as written",
  "LEVEL_MARKERS": "list all level markers (e.g., +0.00, +3.20) exactly as written",
  "HATCHING_INTERPRETATION": "interpretation of all hatching patterns used in the drawing",
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: An exceptionally detailed flowing narrative (15-20 lines) capturing EVERY technical and aesthetic nuance of the section or elevation — vertical composition, material relationships, structural logic, spatial qualities, and all distinguishing architectural features.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from the drawing analysis, written in English, optimized for photorealistic architectural rendering, 3-5 lines, capturing composition, materials, lighting, atmosphere, camera angle, and all key architectural features."
}
 
CRITICAL: Return ONLY the JSON object matching the detected image type. No markdown fences, no explanations, no extra text before or after the JSON.`;
 
// ─── Helper: Extract base64 data and media type ──────────────────────────────
function extractBase64Data(dataUrl: string): { mediaType: string; data: string } {
  const match = dataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (match) {
    if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(match[1])) {
      return { mediaType: match[1], data: match[2] };
    }
  }
  // Raw base64 — detect format from magic bytes prefix
  if (dataUrl.startsWith("iVBOR")) return { mediaType: "image/png",  data: dataUrl };
  if (dataUrl.startsWith("UklGR")) return { mediaType: "image/webp", data: dataUrl };
  if (dataUrl.startsWith("R0lGO")) return { mediaType: "image/gif",  data: dataUrl };
  return { mediaType: "image/jpeg", data: dataUrl };
}
 
// ─── Fetch with timeout helper ────────────────────────────────────────────────
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 40_000  // 40s — leaves margin for Supabase Edge Function wall-clock limit
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
 
// ─── Call Claude via CometAPI (Anthropic-compatible format) ───────────────────
async function callClaude(
  apiKey: string,
  apiBaseUrl: string,
  model: string,
  systemPrompt: string,
  userContent: unknown[],
  maxTokens: number
): Promise<string> {
  const res = await fetchWithTimeout(
    `${apiBaseUrl}/v1/messages`,
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: userContent,
          },
        ],
      }),
    }
  );
 
  if (!res.ok) {
    const status = res.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 401) throw new Error("UNAUTHORIZED");
    const errText = await res.text().catch(() => "");
    console.error("Claude API error:", status, errText);
    throw new Error(`API_ERROR:${status}`);
  }
 
  const data = await res.json();
  // Anthropic format: data.content[0].text
  const content = data?.content?.[0]?.text || "";
  return content;
}
 
// ─── Generate a lightweight integrity signature ───────────────────────────────
function generateSignature(description: string, imageType: string, timestamp: number): string {
  const raw = `${imageType}|${timestamp}|${description.length}|PROMPTRENDER_V2`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
 
// ─── Main handler ─────────────────────────────────────────────────────────────
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
 
    // ── Configuração da API ──────────────────────────────────────────────────
    const API_KEY      = Deno.env.get("COMET_API_KEY") || Deno.env.get("OPENAI_API_KEY") || "";
    const API_MODEL    = "claude-sonnet-4-6";
    const API_BASE_URL = Deno.env.get("COMET_API_URL") || "https://api.cometapi.com";
 
    if (!API_KEY) {
      return new Response(
        JSON.stringify({
          error: "API_KEY não configurada. Adicione COMET_API_KEY nas variáveis de ambiente do Supabase.",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
 
    // Extract base64 data and media type for Anthropic image format
    const { mediaType, data: imageData } = extractBase64Data(base64Image);
 
    // Anthropic image content block
    const imageBlock = {
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: imageData,
      },
    };
 
    // ── Single call: classify + deep analysis ────────────────────────────────
    let rawContent: string;
    try {
      rawContent = await callClaude(
        API_KEY,
        API_BASE_URL,
        API_MODEL,
        SYSTEM_PERSONA,
        [
          imageBlock,
          { type: "text", text: UNIFIED_PROMPT },
        ],
        8192
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === "RATE_LIMIT") {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (msg === "UNAUTHORIZED") {
        return new Response(
          JSON.stringify({ error: "Chave da API inválida ou não configurada corretamente." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw err;
    }
 
    // Strip markdown fences if model wraps response
    let jsonStr = rawContent.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
 
    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(jsonStr);
    } catch (parseErr) {
      const truncated = jsonStr.length > 0 && !jsonStr.trimEnd().endsWith("}");
      console.error(
        `JSON parse failed. Truncated: ${truncated}. Content length: ${jsonStr.length}. Error: ${parseErr}`
      );
      analysis = {
        IMAGE_TYPE: "UNKNOWN",
        FULL_DESCRIPTION: rawContent,
        RENDER_PROMPT_READY: "",
        _parse_error: truncated
          ? "Response was truncated — max_tokens limit may have been reached."
          : "Model returned non-JSON content — raw response preserved in FULL_DESCRIPTION.",
      };
    }
 
    // ── Build imageDescription string and attach integrity metadata ──────────
    const fullDescription  = (analysis.FULL_DESCRIPTION as string) || jsonStr;
    const detectedType     = (analysis.IMAGE_TYPE as string) || "UNKNOWN";
    const timestamp        = Date.now();
    const signature        = generateSignature(fullDescription, detectedType, timestamp);
 
    analysis._meta = {
      detected_type: detectedType,
      classifier_success: true, // classification is now embedded in the single call
    };
 
    analysis._integrity = {
      source: "analyze-image",   // must equal "analyze-image"
      version: 2,                // must equal 2
      timestamp,                 // Unix ms — generate-prompt checks freshness
      detected_type: detectedType,
      description_length: fullDescription.length,
      signature,
    };
 
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
 
  } catch (e) {
    console.error("analyze-image error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro ao analisar imagem",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
 
