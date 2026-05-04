import { ImageAnalysis } from "@/types/promptRender";
import { HUMANIZATION_PROMPT } from "@/config/promptsConfig";
import { supabase } from "@/integrations/supabase/client";
import { PlanTier, validateSelectedPromptKeysByPlan } from "@/config/planPermissions";

// ─── CometAPI config (from Vite env) ─────────────────────────────────────────
const COMET_API_KEY = import.meta.env.VITE_COMET_API_KEY as string;
const COMET_API_URL = import.meta.env.VITE_COMET_API_URL as string || "https://api.cometapi.com";
const COMET_MODEL   = import.meta.env.VITE_COMET_MODEL   as string || "claude-sonnet-4-6";

// ─────────────────────────────────────────────
// GENERATE-PROMPT — constantes e lógica migradas da Edge Function
// ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert prompt engineer specialized in architectural visualization for Nano Banana Pro (Gemini 3 Pro Image), a multimodal AI image editor that receives a base image and a text prompt to apply photorealistic rendering.

YOUR ROLE: Synthesize the selected rendering blocks into a single, concise, technically precise prompt. You are a distiller — not a concatenator.

NANO BANANA PRO CONTEXT:
- It receives the base image directly, so geometric fidelity is partially native to the model
- It responds best to clear, direct technical instructions without excessive repetition
- Prompts should be 150–280 words maximum for optimal model comprehension
- Negative instructions work inline (e.g., "do not add elements absent from the base image")

SYNTHESIS RULES:
1. Extract the single unique intent from each block — discard redundant phrasing
2. Merge camera parameters into ONE concise sentence: height, focal length, aperture, ISO
3. Merge lighting into ONE sentence: color temperature, sun angle, shadow quality, sky description
4. Merge material/quality into ONE sentence: PBR pipeline, key material responses
5. Merge atmosphere/environment into ONE sentence if present
6. Write in flowing technical prose — never use bullet points or headers
7. State geometry preservation ONCE, clearly, at the start
8. End with post-processing parameters in ONE sentence
9. Append the fidelity constraint block verbatim as the final paragraph
10. Total output: prompt body + fidelity block, nothing else — no preamble, no explanation`;

const FIDELITY_CONSTRAINT = `Apply all rendering, lighting, and material changes strictly to elements present in the base image. Do not add, remove, or alter any architectural element, opening, structural feature, or spatial configuration. Do not render dimension lines, annotations, section symbols, room labels, or any technical drawing notation. Vegetation may be enhanced or added freely provided it does not obscure the architecture. Preserve all proportions, angles, and geometry exactly as shown in the base image.`;

const SUFFIX = `Post-processing: full-frame sensor simulation, neutral LUT with slight warm bias, medium-format sharpness output, 3% film grain, subtle lens vignette, no HDR halo artifacts, no blown highlights, full shadow detail retained.`;

const RENDER_PROMPTS: Record<string, string> = {

  // ─── TIPO DE RENDER ───────────────────────────────────────────────────────

  render_externo: `Photorealistic exterior architectural render emulating professional DSLR photography. Apply PBR materials to all existing facade surfaces — concrete, glass, cladding, metal — with accurate Fresnel response. Tilt-shift lens simulation for corrected verticals. Render only what exists in the base image geometry.`,

  render_interno: `Photorealistic interior architectural render emulating professional interior photography. Camera at 1.2m height, 24mm wide-angle, natural perspective with subtle depth of field. Apply PBR materials to all existing surfaces — walls, floors, ceilings, furniture — with accurate diffuse and specular response.`,

  render_aereo: `Cinematic drone aerial render at 80m altitude, 45-degree oblique angle. Full site footprint visible — existing roof planes, landscaping, volumes, and surrounding context. Apply lens distortion correction and atmospheric perspective with depth haze toward background. PBR materials on all existing roof and ground surfaces.`,

  render_detalhe: `Macro architectural detail render emulating 85mm DSLR at F2.0. Razor-sharp focus on the primary detail surface — material junction, window reveal, facade joint, or structural connection. Apply micro-surface PBR textures with subsurface detail. Shallow depth of field softens surrounding context. Render only the existing detail geometry.`,

  render_corte: `Photorealistic architectural section render. Camera perfectly perpendicular to the cut plane, near-orthographic perspective showing full section height. All existing spaces, rooms, and environments rendered with PBR materials and lighting. Cut plane exactly as defined in base image — no reinterpretation. Clean output free of any annotation layer.`,

  planta_humanizada: `Humanized floor plan render from true orthographic top-down camera, zero perspective distortion. Even diffuse global illumination from above. All existing rooms rendered with PBR materials, appropriate furniture finishes, and photorealistic surfaces per room function. Clean output — no annotations, dimensions, labels, or technical notation of any kind.`,

  // ─── PERÍODO DO DIA / ILUMINAÇÃO ─────────────────────────────────────────

  diurno: `Crisp midday natural daylight, sun at 65–75° elevation, 5600K color temperature. Sharp directional shadows on existing surfaces with physically accurate bounce light in shadow zones. Vivid deep-blue sky with scattered cumulus clouds. Full PBR specular and diffuse solar response on all existing facade materials. No overexposure on lit surfaces, full shadow detail retained.`,

  entardecer: `Golden hour lighting, sun at 8–10° above horizon, color temperature 3500K to 2500K. West and south-facing surfaces bathed in warm amber-orange light with subsurface scattering on foliage. Long raking shadows across the ground plane. Sky gradient: burnt orange at horizon through magenta and rose to cobalt blue at zenith. Intense Fresnel specular highlights on existing glazing and polished metals.`,

  noturno: `Full nighttime scene, deep indigo-black sky with subtle star texture and cool moonlight fill. All existing exterior artificial light sources rendered with IES profiles — accurate bloom, lens flare, and falloff. Interior spaces glow warmly through existing glazing onto adjacent exterior surfaces. Artificial sources at 2700K–3000K. Deep shadow zones with rich dark tones and soft ambient spill from nearby fixtures.`,

  nublado: `Soft overcast diffused lighting, dense cloud cover as natural diffusion panel, 6500K color temperature. Zero hard shadows — all existing surfaces receive soft, even, directionless illumination revealing subtle form and texture. Silver-white to light-gray sky with volumetric tonal depth. Existing material colors rendered at maximum saturation accuracy, free from direct sunlight interference.`,

  chuva: `Active rainstorm atmosphere, dark mid-gray stratocumulus sky. Fine rain streaks as diagonal motion blur across the frame. Thin highly reflective water film on all existing horizontal surfaces with mirror-like sky reflections. Puddles in low points and geometry joints. Existing glazing streaked with water rivulets with accurate refraction. Flat cool ambient light at 6800K. Existing artificial sources with amplified bloom and volumetric moisture shafts.`,

  amanhecer: `Pre-sunrise dawn lighting, sun below horizon. Sky gradient: deep charcoal at zenith through rose pink, peach, and pale lavender to warm luminous glow at horizon. Cool 4200K indirect sky dome, no direct solar shadows. Subtle low ground haze at 0.5–1.0m height. Existing vegetation shows photorealistic dew. All existing facade surfaces receive cool soft directional fill from horizon zone.`,

  // ─── QUALIDADE / ESTILO DO RENDER ────────────────────────────────────────

  fotorrealista: `8K PBR pipeline: BSDF for all existing materials, unbiased ray-traced GI, path-traced reflections and refractions. Accurate Fresnel on existing glass and polished surfaces, micro-surface roughness on existing matte materials, SSS on existing organic elements. Camera: Canon EOS R5 equivalent, 35mm prime, F4, ISO 200, scientifically accurate dynamic range. Post: 4% film grain, vignette, chromatic aberration consistent with real lens optics.`,

  classico: `Academic architectural presentation quality. Neutral color grading with subtle warm bias, soft diffused shadows, balanced illumination. All existing materials rendered with technical PBR color fidelity — no mood manipulation or extreme contrast. Clean sky, non-distracting. Existing vegetation as calm well-defined green masses with accurate PBR leaf textures. Output equivalent to AIA portfolio or RIBA award documentation standard.`,

  atmosferico: `Cinematic editorial grade. Strong foreground-to-background depth layering, lifted blacks, crushed highlights, rich color grading with intentional mood bias. Deep shadow zones with selective fill using existing architectural lines and volumes as compositional anchors. Advanced volumetric fog, haze, or dust motes enhance existing scene mood. Output equivalent to Dezeen or Wallpaper* architectural editorial photography.`,

  minimalista: `Stripped-back minimalist render. Existing architecture against neutral pale or white overcast sky. Uniform light-toned ground plane with minimal texture variation. Color palette limited to existing material range — no supplementary color. Generous negative space, clean geometric composition. Existing vegetation reduced to calm restrained masses. Even soft GI emphasizing architectural purity of existing design.`,

  // ─── ELEMENTOS DO AMBIENTE ────────────────────────────────────────────────

  piscina: `For the existing pool: PBR tile or mosaic cladding with subtle grout lines and accurate reflectivity. Crystal-clear water with physically accurate transparency, refraction, and dynamic caustics on pool floor and walls. Existing deck surfaces in PBR natural wood or porcelain with realistic grain, texture, and specular response. Apply photorealistic materials to existing poolside furniture already present.`,

  jardim: `For existing garden and vegetation areas: PBR foliage with natural vibrant colors, accurate leaf textures, subtle imperfections, and correct natural scale. Advanced subsurface scattering on existing leaves and petals. Soft-edged shadows cast by existing vegetation with lighting coherent to the active environment. Botanical detail applied only to existing planting elements.`,

  area_gourmet: `For the existing gourmet area: ambient string lighting with realistic falloff and bloom at existing fixture locations. PBR materials on existing elements — natural wood pergola and furniture with authentic grain and weathering, natural stone or porcelain countertops with accurate reflectivity, brushed stainless appliances with anisotropic reflections. Warm balanced GI consistent with high-end outdoor dining.`,

  garagem: `For the existing garage and approach: PBR floor texture — concrete, pavers, or asphalt — with subtle wear, tire marks, and accurate reflectivity. Precise PBR finish on existing architectural car portal. Existing vehicles if present rendered with accurate paint reflections, subtle dust, and realistic tire textures. Natural GI coherent with existing facade lighting.`,

  deck: `For the existing deck: hyper-realistic natural hardwood PBR texture with rich authentic timber grain, realistic weathering — subtle fading, water stains, micro-scratches — and natural tonal variation. PBR fabrics and materials on existing outdoor lounge furniture. Warm natural GI enhancing existing wood tones.`,

  iluminacao_cenica: `For existing nighttime scene: dramatic uplighting at existing facade fixture positions with accurate IES spotlight profiles dynamically highlighting existing architectural volumes. Soft warm glow at existing path lighting positions with realistic falloff. LED strip accent at existing architectural detail light locations. All existing sources at 3000K with physically accurate bloom, lens flare, and volumetric shafts.`,

  nevoa: `Morning atmospheric fog: ethereal mist layers enveloping lower site areas and ground plane. Soft volumetric depth haze reducing background visibility of existing elements. Diffused soft lighting coherent with foggy morning. Muted cool blue-grey palette with desaturated hues and reduced contrast applied to existing scene elements.`,

  espelho_dagua: `For the existing reflecting pool or water mirror: hyper-realistic still water as zen reflecting surface. Mirror-like reflections of sky, existing architecture, and existing light sources. Dynamic caustic light patterns on existing pool floor. PBR water material with accurate transparency, refraction, and visible delicate surface tension.`,

  // ─── ENTORNO ─────────────────────────────────────────────────────────────

  entorno_residencial: `Existing residential surroundings — neighboring houses, garden walls, fences, parked vehicles, sidewalks — rendered at photorealistic fidelity consistent with the primary building scale. PBR material variation on existing surrounding structures. Surrounding context visually subordinate with slight depth-of-field falloff toward background. No invented context elements.`,

  entorno_comercial: `Existing commercial urban surroundings — mid to high-rise facades, retail frontages, wide paving, vehicle and pedestrian flow, street furniture — rendered at photorealistic fidelity consistent with existing density. PBR material variation on existing surrounding buildings. Urban background with correct atmospheric haze and depth falloff. No invented context elements.`,
};

const PROMPT_CATEGORIES: Record<string, string[]> = {
  render: [
    "render_externo",
    "render_interno",
    "render_aereo",
    "render_detalhe",
    "render_corte",
    "planta_humanizada",
  ],
  iluminacao: ["diurno", "entardecer", "noturno", "nublado", "chuva", "amanhecer"],
  estilo: ["fotorrealista", "classico", "atmosferico", "minimalista"],
  ambiente: [
    "piscina",
    "jardim",
    "area_gourmet",
    "garagem",
    "deck",
    "iluminacao_cenica",
    "nevoa",
    "espelho_dagua",
  ],
  entorno: ["entorno_residencial", "entorno_comercial"],
};

const ORDERED_CATEGORIES = ["render", "iluminacao", "estilo", "ambiente", "entorno"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildResolvedBlocks(selectedKeys: string[]): string[] {
  const blocks: string[] = [];
  for (const category of ORDERED_CATEGORIES) {
    for (const key of PROMPT_CATEGORIES[category] ?? []) {
      if (selectedKeys.includes(key) && RENDER_PROMPTS[key]?.trim()) {
        blocks.push(`[${key.toUpperCase()}]\n${RENDER_PROMPTS[key].trim()}`);
      }
    }
  }
  return blocks;
}

function buildUserMessage(
  imageDescription: string,
  blocks: string[],
  humanizationText: string
): string {
  const humanizationSection = humanizationText?.trim()
    ? `\nPEOPLE/ANIMALS (include only if explicitly described — do not invent): ${humanizationText.trim()}`
    : "";

  return (
    `BASE_IMAGE_DESCRIPTION (sole reference for what exists in the scene):\n${imageDescription.trim()}\n\n` +
    `RENDERING BLOCKS TO SYNTHESIZE:\n${blocks.join("\n\n")}${humanizationSection}\n\n` +
    `FIDELITY_CONSTRAINT (append verbatim as final paragraph):\n${FIDELITY_CONSTRAINT}\n\n` +
    `POST_PROCESSING (append verbatim after synthesized body, before FIDELITY_CONSTRAINT):\n${SUFFIX}\n\n` +
    `TASK: Synthesize the RENDERING BLOCKS into a single concise technical prompt of 150–280 words. ` +
    `Write flowing technical prose. Extract unique intent from each block, eliminate all redundancy. ` +
    `Suppress any geometry-specific instruction from a block if that element is absent from BASE_IMAGE_DESCRIPTION — apply only its lighting/atmospheric quality generically. ` +
    `Structure: [synthesized body] → [POST_PROCESSING verbatim] → [FIDELITY_CONSTRAINT verbatim]. ` +
    `Output only the final prompt text — no preamble, no explanation, no markdown.`
  );
}

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

// ─── Generate integrity signature ─────────────────────────────────────────────
function generateSignature(description: string, imageType: string, timestamp: number): string {
  const raw = `${imageType}|${timestamp}|${description.length}|PROMPTRENDER_V2`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

// ─────────────────────────────────────────────
// STEP 02 — Analisa a imagem direto via CometAPI (sem Edge Function)
// ─────────────────────────────────────────────
export async function analyzeImage(base64Image: string): Promise<ImageAnalysis> {
  if (!COMET_API_KEY) {
    throw new Error("VITE_COMET_API_KEY não configurada. Adicione ao .env do projeto.");
  }

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
// STEP 05 — Gera o prompt final direto via CometAPI (sem Edge Function)
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
  if (!COMET_API_KEY) {
    throw new Error("VITE_COMET_API_KEY não configurada. Adicione ao .env do projeto.");
  }

  const validation = validateSelectedPromptKeysByPlan(selectedKeys, effectivePlan);
  if (!validation.valid) {
    throw new Error("Algumas opções selecionadas exigem plano Pro. Ajuste as configurações e tente novamente.");
  }

  // ── Build humanization text ──────────────────────────────────────────────
  let humanizationText = "";
  if (humanization.enabled) {
    const pessoas = humanization.addPeople ? humanization.peopleDescription.trim() : "";
    const animais = humanization.addAnimals ? humanization.animalDescription.trim() : "";
    if (pessoas || animais) {
      humanizationText = formatHumanization(pessoas, animais);
    }
  }

  // ── Build blocks and user message ────────────────────────────────────────
  const resolvedBlocks = buildResolvedBlocks(selectedKeys);

  if (resolvedBlocks.length === 0) {
    throw new Error("Nenhum bloco com conteúdo válido encontrado para as chaves selecionadas.");
  }

  const userMessage = buildUserMessage(imageDescription, resolvedBlocks, humanizationText);

  // ── Call CometAPI directly (no Edge Function — no timeout risk) ──────────
  const response = await fetch(`${COMET_API_URL}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": COMET_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: COMET_MODEL,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("Limite de requisições excedido. Tente novamente em alguns instantes.");
    if (status === 401) throw new Error("Chave da API inválida ou não configurada corretamente.");
    const errText = await response.text().catch(() => "");
    console.error("CometAPI generate-prompt error:", status, errText);
    throw new Error(`Erro ao gerar prompt (status ${status}). Tente novamente.`);
  }

  const data = await response.json();
  const prompt: string = data.content
    ?.filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("")
    .trim() ?? "";

  if (!prompt) throw new Error("O modelo retornou uma resposta vazia.");

  const usedKeys = selectedKeys.filter((k) => {
    for (const category of ORDERED_CATEGORIES) {
      if (PROMPT_CATEGORIES[category]?.includes(k) && RENDER_PROMPTS[k]?.trim()) return true;
    }
    return false;
  });

  // ── Save to prompt_history ────────────────────────────────────────────────
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
