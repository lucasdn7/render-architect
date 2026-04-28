import { ImageAnalysis } from "@/types/promptRender";
import { HUMANIZATION_PROMPT } from "@/config/promptsConfig";
import { supabase } from "@/integrations/supabase/client";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { PlanTier, validateSelectedPromptKeysByPlan } from "@/config/planPermissions";
 
// ─── CometAPI config (from Vite env) ─────────────────────────────────────────
const COMET_API_KEY  = import.meta.env.VITE_COMET_API_KEY  as string;
const COMET_API_URL  = import.meta.env.VITE_COMET_API_URL  as string || "https://api.cometapi.com";
const COMET_MODEL    = import.meta.env.VITE_COMET_MODEL    as string || "claude-sonnet-4-6";
 
// ─── System persona ───────────────────────────────────────────────────────────
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
  "ROOMS_INVENTORY": [{ "name": "", "area_m2": "", "dimensions": "", "ceiling_height": "", "floor_finish": "", "notes": "" }],
  "ROOM_COUNT_SUMMARY": "total count by type: X bedrooms, X bathrooms, X living areas, X service areas, etc.",
  "SPATIAL_ZONING": "how the plan is organized — social zone, private zone, service zone, circulation zone",
  "CIRCULATION": "description of all internal circulation paths — corridors, hallways, transition spaces",
  "VERTICAL_CIRCULATION": "stairs (type: straight/L/U/spiral, number of risers if readable), elevators, ramps",
  "WALLS": "wall types visible — load-bearing (thick solid), partition (thin), glass walls, curved walls",
  "WALL_THICKNESS": "typical wall thicknesses as readable from dimensions or scale",
  "DOORS": [{ "type": "", "location": "", "swing_direction": "", "approximate_width": "" }],
  "WINDOWS": [{ "type": "", "location": "", "approximate_width": "", "notes": "" }],
  "FURNITURE_INVENTORY": "COMPLETE list of ALL furniture blocks visible — specify room, piece type, approximate size, arrangement",
  "KITCHEN_DETAILS": "kitchen layout type (L/U/galley/island/peninsula), all visible appliances and fixtures",
  "BATHROOM_DETAILS": "for EACH bathroom — fixtures present, layout, approximate dimensions",
  "SERVICE_AREAS": "laundry room, utility room, storage — equipment visible, dimensions",
  "GARAGE": "number of car spaces, dimensions, access type, gate type, floor finish annotation",
  "OUTDOOR_AREAS": "terraces, balconies, decks, patios — dimensions if annotated, furniture shown",
  "POOL_SPA": "pool/spa presence — shape, approximate dimensions, coping, deck area",
  "GARDEN_LANDSCAPE": "garden areas, planting beds, trees shown in plan, paving patterns, pathways",
  "DIMENSIONS_ANNOTATIONS": "ALL visible dimension strings — list key overall and room-specific dimensions exactly as written",
  "SECTION_CUT_INDICATORS": "any section cut lines, elevation markers, or detail callouts visible in the plan",
  "STRUCTURAL_GRID": "column grid if visible — spacing, column sizes",
  "MEP_ELEMENTS": "any mechanical/electrical/plumbing elements shown",
  "HATCHING_MATERIALS": "interpretation of all hatching patterns used — what materials they represent",
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: An exceptionally detailed flowing narrative (15-20 lines) capturing EVERY spatial and technical nuance of the floor plan.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from the plan analysis, written in English, optimized for photorealistic architectural rendering, 3-5 lines."
}
 
--- FOR SECTION / ELEVATION / DETAIL_DRAWING ---
{
  "IMAGE_TYPE": "Section or Elevation — specify which, and orientation (e.g., North Elevation, Section A-A)",
  "DRAWING_SCALE": "scale indicated in the drawing or estimated from dimensions",
  "TOTAL_HEIGHT": "total building height from grade to highest point as annotated",
  "FLOOR_TO_FLOOR_HEIGHTS": "list all floor-to-floor or floor-to-ceiling heights as annotated",
  "FACADE_COMPOSITION": "detailed description of facade materials, cladding, fenestration, patterns, ornamental details",
  "INTERNAL_SPACES": "list all rooms/spaces cut through, their functions, and spatial relationships",
  "STRUCTURAL_ELEMENTS": "foundations, slabs, walls, columns, beams, roof structure — materials and thicknesses",
  "OPENINGS": "doors and windows visible — types, materials, dimensions if annotated",
  "VERTICAL_CIRCULATION": "stairs, elevators, ramps shown in section — type, number of risers, materials",
  "ROOF_DETAILS": "roof form, pitch, materials, eaves, parapets, drainage details",
  "GROUND_RELATIONSHIP": "how the building meets the ground — grade levels, foundations, basement, landscaping at grade",
  "MATERIALS_FINISHES": "all materials indicated by hatching or annotations",
  "DIMENSIONS_ANNOTATIONS": "ALL visible dimension strings — key vertical and horizontal dimensions exactly as written",
  "LEVEL_MARKERS": "list all level markers (e.g., +0.00, +3.20) exactly as written",
  "HATCHING_INTERPRETATION": "interpretation of all hatching patterns used in the drawing",
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: An exceptionally detailed flowing narrative (15-20 lines) capturing EVERY technical and aesthetic nuance of the section or elevation.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from the drawing analysis, written in English, optimized for photorealistic architectural rendering, 3-5 lines."
}
 
CRITICAL: Return ONLY the JSON object matching the detected image type. No markdown fences, no explanations, no extra text before or after the JSON.`;
 
// ─── Generate integrity signature (mirrors Edge Function logic) ───────────────
function generateSignature(description: string, imageType: string, timestamp: number): string {
  const raw = `${imageType}|${timestamp}|${description.length}|PROMPTRENDER_V2`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
 
async function getFunctionsErrorMessage(error: unknown, fallbackMessage: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error && typeof body.error === "string") return body.error;
      if (body?.message && typeof body.message === "string") return body.message;
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
// STEP 02 — Analisa a imagem direto via CometAPI (sem Edge Function)
// ─────────────────────────────────────────────
export async function analyzeImage(base64Image: string): Promise<ImageAnalysis> {
  if (!COMET_API_KEY) {
    throw new Error("VITE_COMET_API_KEY não configurada. Adicione ao .env do projeto.");
  }
 
  // Extract base64 data and media type
  let mediaType = "image/jpeg";
  let imageData = base64Image;
 
  const match = base64Image.match(/^data:(image\/[a-z]+);base64,(.+)$/);
  if (match) {
    if (["image/jpeg", "image/png", "image/gif", "image/webp"].includes(match[1])) {
      mediaType = match[1];
    }
    imageData = match[2];
  } else {
    if (base64Image.startsWith("iVBOR")) mediaType = "image/png";
    else if (base64Image.startsWith("UklGR")) mediaType = "image/webp";
    else if (base64Image.startsWith("R0lGO")) mediaType = "image/gif";
  }
 
  const response = await fetch(`${COMET_API_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": COMET_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: COMET_MODEL,
      max_tokens: 8192,
      system: SYSTEM_PERSONA,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageData,
              },
            },
            {
              type: "text",
              text: UNIFIED_PROMPT,
            },
          ],
        },
      ],
    }),
  });
 
  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("Limite de requisições excedido. Tente novamente em alguns segundos.");
    if (status === 401) throw new Error("Chave da API inválida ou não configurada corretamente.");
    const errText = await response.text().catch(() => "");
    console.error("CometAPI error:", status, errText);
    throw new Error(`Erro ao analisar imagem (status ${status}). Tente novamente.`);
  }
 
  const data = await response.json();
  const rawContent: string = data?.content?.[0]?.text || "";
 
  // Strip markdown fences if model wraps response
  let jsonStr = rawContent.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();
 
  let analysis: Record<string, unknown>;
  try {
    analysis = JSON.parse(jsonStr);
  } catch {
    const truncated = jsonStr.length > 0 && !jsonStr.trimEnd().endsWith("}");
    console.error(`JSON parse failed. Truncated: ${truncated}. Length: ${jsonStr.length}`);
    analysis = {
      IMAGE_TYPE: "UNKNOWN",
      FULL_DESCRIPTION: rawContent,
      RENDER_PROMPT_READY: "",
      _parse_error: truncated
        ? "Response was truncated — max_tokens limit may have been reached."
        : "Model returned non-JSON content — raw response preserved in FULL_DESCRIPTION.",
    };
  }
 
  // Attach integrity metadata (mirrors Edge Function logic so generate-prompt stays compatible)
  const fullDescription = (analysis.FULL_DESCRIPTION as string) || jsonStr;
  const detectedType    = (analysis.IMAGE_TYPE as string) || "UNKNOWN";
  const timestamp       = Date.now();
  const signature       = generateSignature(fullDescription, detectedType, timestamp);
 
  analysis._meta = {
    detected_type: detectedType,
    classifier_success: true,
  };
 
  analysis._integrity = {
    source: "analyze-image",
    version: 2,
    timestamp,
    detected_type: detectedType,
    description_length: fullDescription.length,
    signature,
  };
 
  return analysis as unknown as ImageAnalysis;
}
 
// ─────────────────────────────────────────────
// STEP 04 — Formata humanização em linguagem técnica
// ─────────────────────────────────────────────
export function formatHumanization(pessoas: string, animais: string): string {
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
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
 
  const { data: historyRow, error: insertError } = await supabase
    .from("prompt_history")
    .insert({
      user_id: historyContext?.userId,
      prompt,
      image_preview: historyContext?.imagePreview || null,
      render_config: (historyContext?.renderConfig ?? {}) as unknown as import("@/integrations/supabase/types").Json,
      word_count: wordCount,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .maybeSingle();
 
  if (insertError) {
    console.error("prompt_history insert error:", insertError);
    throw new Error("Prompt gerado, mas houve erro ao salvar no histórico.");
  }
 
  return { prompt, usedKeys, historyId: (historyRow as { id?: string } | null)?.id ?? null };
}
