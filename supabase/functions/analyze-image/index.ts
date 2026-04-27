// @ts-nocheck
// This file runs in Deno environment on Supabase Edge Functions
// TypeScript errors are expected in local IDE due to Deno-specific APIs
 
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
 
const SYSTEM_PERSONA = `You are an elite forensic architectural analyst with 30 years of experience across architectural design, technical documentation, and photorealistic rendering. You possess expert-level reading ability for ALL types of architectural representations: photorealistic 3D renders, on-site photography, 2D floor plans, sections, elevations, axonometric drawings, site plans, construction details, and concept sketches.
 
When analyzing 2D technical drawings (floor plans, sections, elevations), you read them with the precision of a licensed architect: you identify every room by its label or inferred function, read all dimension annotations, interpret hatching patterns as specific materials, recognize standard architectural symbols for doors/windows/stairs/fixtures/furniture, and understand spatial relationships between elements. You extract EVERY piece of information visible in the drawing — no label, dimension, room, wall, opening, furniture block, or notation is overlooked.
 
You always write analysis in English, with extreme technical precision.`;
 
// ─── Image type classifier prompt ────────────────────────────────────────────
const CLASSIFIER_PROMPT = `First, classify this image into EXACTLY ONE of these categories (return only the category string, nothing else, no punctuation, no explanation):
- RENDER_3D
- PHOTO
- FLOOR_PLAN
- SECTION
- ELEVATION
- SITE_PLAN
- AXONOMETRIC
- DETAIL_DRAWING
- CONCEPT_SKETCH
- MIXED
 
Definitions:
- RENDER_3D: photorealistic 3D render or CGI visualization
- PHOTO: real architectural photography
- FLOOR_PLAN: 2D top-down plan view showing rooms and layout
- SECTION: 2D vertical cut through a building
- ELEVATION: 2D exterior or interior facade view
- SITE_PLAN: 2D overhead site/plot plan
- AXONOMETRIC: 3D projection without perspective
- DETAIL_DRAWING: construction detail or node drawing
- CONCEPT_SKETCH: hand-drawn or loose sketch
- MIXED: combination of the above
 
Return ONLY the category string. No extra text, no punctuation.`;
 
// ─── 3D / Photo / Sketch / Detail / Mixed analysis prompt ───────────────────
const PROMPT_3D = `As a forensic architectural analyst with 30 years of experience, conduct a COMPREHENSIVE and EXHAUSTIVE analysis of every single detail visible in this architectural image. Return ONLY a valid JSON object with these fields:
 
{
  "IMAGE_TYPE": "precise classification (photorealistic 3D render, architectural photography, concept sketch, axonometric, perspective, detail drawing, mixed)",
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
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: An exceptionally detailed flowing narrative (15–20 lines) capturing EVERY nuance — overall impression, massing, proportions, material relationships, spatial qualities, light behavior, atmosphere, and ALL distinguishing characteristics.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from the analysis above, written in English, optimized for photorealistic architectural rendering, 3–5 lines, capturing style, materials, lighting, atmosphere, camera angle, and all key architectural features. This field should be directly usable as input for an AI image generator."
}
 
CRITICAL: Return ONLY the JSON object. No markdown, no explanations, no extra text.`;
 
// ─── Floor Plan analysis prompt ──────────────────────────────────────────────
const PROMPT_FLOOR_PLAN = `You are reading a 2D architectural floor plan. Conduct a COMPREHENSIVE and EXHAUSTIVE analysis extracting every piece of information visible. Return ONLY a valid JSON object:
 
{
  "IMAGE_TYPE": "Floor Plan — specify if ground floor, upper floor, basement, roof plan, or composite",
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
  "FURNITURE_INVENTORY": "COMPLETE list of ALL furniture blocks visible — specify room, piece type, approximate size, arrangement (e.g.: 'Living room: 3-seat sofa + 2-seat sofa + coffee table + TV unit; Bedroom 1: queen bed with 2 nightstands + wardrobe')",
  "KITCHEN_DETAILS": "kitchen layout type (L/U/galley/island/peninsula), all visible appliances and fixtures — cooktop (number of burners), oven, refrigerator, sink, dishwasher, island dimensions, counter runs",
  "BATHROOM_DETAILS": "for EACH bathroom — fixtures present (toilet, bidet, bathtub, shower, sink count, vanity), layout, approximate dimensions",
  "SERVICE_AREAS": "laundry room, utility room, storage — equipment visible (washing machine, dryer, water heater, storage shelves), dimensions",
  "GARAGE": "number of car spaces, dimensions, access type (direct internal access, external only), gate type, floor finish annotation",
  "OUTDOOR_AREAS": "terraces, balconies, decks, patios — dimensions if annotated, furniture shown, orientation relative to interior",
  "POOL_SPA": "pool/spa presence — shape, approximate dimensions, coping, deck area, equipment room location",
  "GARDEN_LANDSCAPE": "garden areas, planting beds, trees shown in plan (circle symbols), paving patterns, pathways",
  "DIMENSIONS_ANNOTATIONS": "ALL visible dimension strings — list key overall dimensions and room-specific dimensions exactly as written",
  "SECTION_CUT_INDICATORS": "any section cut lines, elevation markers, or detail callouts visible in the plan",
  "STRUCTURAL_GRID": "column grid if visible — spacing, column sizes",
  "MEP_ELEMENTS": "any mechanical/electrical/plumbing elements shown — drain points, electrical panels, HVAC units, duct routes",
  "HATCHING_MATERIALS": "interpretation of all hatching patterns used — what material each pattern represents (concrete, brick, insulation, wood, stone, etc.)",
  "TITLE_BLOCK": "any title block information — project name, architect, date, scale, revision, drawing number",
  "NOTES_LEGENDS": "any written notes, legends, symbols explanations, or specifications visible in the drawing",
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: A comprehensive narrative (15–20 lines) that reads the floor plan as an experienced architect would — describing the overall spatial concept, room distribution, circulation logic, indoor-outdoor relationships, functional zoning, notable design decisions, and every key element visible. Describe it with enough detail that a contractor or renderer could fully understand the layout without seeing the drawing.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from this floor plan analysis, written in English, optimized for photorealistic architectural rendering of the interior spaces described, 3–5 lines, capturing spatial layout, materials, lighting potential, atmosphere, and key architectural features."
}
 
CRITICAL INSTRUCTIONS:
- Read EVERY room label, dimension string, and annotation exactly as written
- Identify furniture blocks by their standard plan symbols (rectangle = bed/sofa/table, circle = dining chair, etc.)
- Interpret door swing arcs to determine door type and direction
- Distinguish between solid walls (load-bearing) and thin partition walls
- Count every bathroom fixture, kitchen appliance, and piece of furniture
- Note the spatial relationship and sequence between all rooms
- Return ONLY the JSON object. No markdown, no explanations, no extra text.`;
 
// ─── Section analysis prompt ─────────────────────────────────────────────────
const PROMPT_SECTION = `You are reading a 2D architectural section drawing. Conduct a COMPREHENSIVE and EXHAUSTIVE analysis. Return ONLY a valid JSON object:
 
{
  "IMAGE_TYPE": "Section — specify longitudinal/transversal/cross/building section or wall section/detail",
  "DRAWING_SCALE": "scale indicated or estimated",
  "CUT_DIRECTION": "direction of the section cut relative to the building",
  "FLOORS_LEVELS": [
    {
      "level_name": "ground floor / first floor / basement / roof / etc.",
      "floor_to_floor_height": "dimension if readable",
      "floor_to_ceiling_height": "clear height dimension",
      "floor_finish_thickness": "if shown"
    }
  ],
  "TOTAL_BUILDING_HEIGHT": "overall height from lowest point to highest if readable",
  "STRUCTURAL_SYSTEM": "foundation type visible (slab, footings, piles), structural frame (concrete, steel, timber), floor/ceiling assembly type",
  "ROOF_ASSEMBLY": "complete roof section — slope/pitch, structural layer, insulation, waterproofing, finish layer, parapet or eave detail",
  "WALL_ASSEMBLIES": "each wall type in section — layers from exterior to interior, thicknesses, materials, insulation",
  "FLOOR_ASSEMBLIES": "floor build-up layers — structural slab, screed, insulation, finish material, thickness of each",
  "CEILING_TYPES": "ceiling assemblies — suspended/direct fix/exposed structure, materials, heights",
  "OPENINGS_IN_SECTION": "all doors and windows shown — height, head height, sill height, frame depth, glazing type",
  "VERTICAL_CIRCULATION": "stairs shown in section — tread depth, riser height, total rise, handrail/balustrade material and design, understairs space use",
  "SPACES_CUT_THROUGH": "list every room/space the section passes through — name, width, height, floor and ceiling finish",
  "SPACES_VISIBLE_BEYOND": "spaces visible in the background beyond the cut line",
  "DOUBLE_HEIGHT_VOIDS": "any double-height or multi-storey voids — dimensions, purpose",
  "SKYLIGHTS_LIGHTWELLS": "any top-lighting elements shown in section",
  "SUBGRADE_ELEMENTS": "basement, retaining walls, drainage, waterproofing below grade",
  "MEP_IN_SECTION": "any services visible in section — ducts, pipes, conduits, plumbing chase locations",
  "DIMENSIONS_ANNOTATIONS": "ALL dimension strings exactly as written — vertical and horizontal",
  "MATERIALS_HATCHING": "interpretation of every hatching pattern in section — concrete (solid fill), insulation (zigzag), timber (grain lines), brick (running bond), etc.",
  "GRADE_LEVELS": "existing and finished ground levels shown, retaining walls, steps at entry",
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: A detailed narrative (15–20 lines) reading the section as an architect — describing the spatial sequence cut through, structural logic, floor-to-floor heights, material layering, vertical relationships between spaces, and all key technical details visible.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from this section analysis, written in English, optimized for photorealistic architectural rendering, 3–5 lines, capturing the spatial section view, structural materials, lighting conditions, and architectural atmosphere."
}
 
CRITICAL: Return ONLY the JSON object. No markdown, no explanations, no extra text.`;
 
// ─── Elevation analysis prompt ───────────────────────────────────────────────
const PROMPT_ELEVATION = `You are reading a 2D architectural elevation drawing. Conduct a COMPREHENSIVE and EXHAUSTIVE analysis. Return ONLY a valid JSON object:
 
{
  "IMAGE_TYPE": "Elevation — specify which face (North/South/East/West/Front/Rear/Left/Right/Interior)",
  "DRAWING_SCALE": "scale indicated or estimated",
  "OVERALL_DIMENSIONS": "total width and height of the elevation as annotated",
  "NUMBER_OF_FLOORS": "count of stories visible, with floor line heights if annotated",
  "FLOOR_HEIGHTS": "height of each floor level marked on elevation",
  "ROOF_FORM": "roof type visible in elevation — flat/pitched/gable/hip/shed/curved, slope angle if annotated",
  "FACADE_COMPOSITION": "overall facade organization — symmetry/asymmetry, grid, proportions, solid-to-void ratio, horizontal/vertical emphasis",
  "CLADDING_MATERIALS": "EVERY cladding material visible — specify exactly which zone of the facade each covers, with dimensions if annotated",
  "WINDOWS_ELEVATION": [
    {
      "location": "floor level and horizontal position",
      "type": "fixed/casement/sliding/curtain wall/louvered",
      "dimensions": "width x height if readable",
      "frame_material": "aluminum/timber/steel/uPVC",
      "glazing": "clear/frosted/tinted/reflective/patterned",
      "mullion_pattern": "grid description if applicable",
      "special_features": "corner window, floor-to-ceiling, clerestory, skylight, etc."
    }
  ],
  "DOORS_ELEVATION": [
    {
      "location": "position on facade",
      "type": "single/double/sliding/pivot/garage/entry",
      "dimensions": "width x height if readable",
      "material": "timber/glass/metal/composite",
      "design_detail": "panel pattern, glazing insert, hardware visibility"
    }
  ],
  "ARCHITECTURAL_FEATURES": "ALL facade features — balconies (depth, railing type, material), terraces, canopies (dimensions, material, connection), sunshades/brise-soleil, louvres, overhangs, recesses, reveals, shadow gaps",
  "HORIZONTAL_ELEMENTS": "floor lines, belt courses, string courses, sills, heads, lintels — materials and dimensions",
  "VERTICAL_ELEMENTS": "columns, pilasters, fins, reveals — spacing, dimensions, materials",
  "ROOF_ELEMENTS": "parapets (height, coping detail), eaves, soffits, gutters, downpipes — positions and materials",
  "GROUND_ELEMENTS": "plinth, base treatment, entry steps, ramp, threshold detail, ground paving shown",
  "VEGETATION_SHOWN": "any plants, trees, green walls shown in elevation — species if labeled, position",
  "FINISHES_COLORS": "all surface finishes annotated or shown — paint colors (with codes if present), natural materials, treated surfaces",
  "DIMENSIONS_ANNOTATIONS": "ALL visible dimensions exactly as written — height markers, level indicators, width dimensions",
  "MATERIAL_LEGENDS": "any material key, legend, or annotation list provided",
  "LEVEL_MARKERS": "all level/datum annotations — finished floor levels, finished ground level, top of parapet, ridge",
  "GRID_LINES": "structural grid lines shown on elevation — labels and spacing",
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: A detailed narrative (15–20 lines) reading the elevation as an architect — describing the overall facade composition, material palette, fenestration strategy, proportional system, architectural character, and every notable feature visible from this face of the building.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from this elevation analysis, written in English, optimized for photorealistic architectural rendering of this facade, 3–5 lines, capturing facade materials, fenestration, architectural style, lighting angle, and atmosphere."
}
 
CRITICAL: Return ONLY the JSON object. No markdown, no explanations, no extra text.`;
 
// ─── Site Plan analysis prompt ───────────────────────────────────────────────
const PROMPT_SITE_PLAN = `You are reading a 2D architectural site plan. Conduct a COMPREHENSIVE and EXHAUSTIVE analysis. Return ONLY a valid JSON object:
 
{
  "IMAGE_TYPE": "Site Plan — specify scale and coverage area",
  "DRAWING_SCALE": "scale indicated or estimated",
  "NORTH_ORIENTATION": "north arrow direction",
  "LOT_DIMENSIONS": "all lot boundary dimensions as annotated",
  "LOT_AREA": "total lot area if annotated",
  "LOT_GEOMETRY": "shape description and boundary conditions",
  "STREET_CONTEXT": "street names, widths, sidewalk widths, curb lines visible",
  "BUILDING_FOOTPRINT": "built area on site — shape, dimensions, position on lot",
  "SETBACKS": "front/rear/side setbacks as annotated or measurable",
  "SITE_COVERAGE": "approximate percentage of lot covered by building",
  "OUTDOOR_ZONES": "all outdoor areas — garden, patio, deck, pool, parking, driveway — shape, dimensions, materials",
  "POOL_SPA": "pool shape, dimensions, deck area, equipment location",
  "PARKING": "number of spaces, dimensions, access points, gate locations, surface material",
  "LANDSCAPING": "all vegetation shown — tree symbols (size indicating canopy spread), planting beds, lawn areas, hedges, ground cover",
  "PAVING_PATTERNS": "all hard surfaces — material, pattern, joint width for each zone",
  "SITE_LEVELS": "any contour lines, spot levels, retaining walls, grade changes shown",
  "DRAINAGE": "drainage elements — swales, catch basins, drainage routes",
  "UTILITIES": "utility connections visible — water, sewer, electrical entry points",
  "FENCING_WALLS": "boundary treatment — fence type, wall material, height if annotated, gate positions",
  "DIMENSIONS_ANNOTATIONS": "ALL dimension strings exactly as written",
  "FULL_DESCRIPTION": "MASTER DESCRIPTION: A detailed narrative (15–20 lines) reading the site plan as a landscape architect — describing the lot geometry, building placement strategy, outdoor space hierarchy, circulation, landscaping concept, and all key site elements.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from this site plan analysis, written in English, optimized for photorealistic architectural aerial or bird's-eye rendering, 3–5 lines, capturing site layout, landscaping, materials, lighting, and surrounding context."
}
 
CRITICAL: Return ONLY the JSON object. No markdown, no explanations, no extra text.`;
 
// ─── Generic fallback prompt ──────────────────────────────────────────────────
const PROMPT_GENERIC = `Analyze this architectural image comprehensively. Return ONLY a valid JSON object with the following fields:
{
  "IMAGE_TYPE": "best classification you can determine",
  "FULL_DESCRIPTION": "An exceptionally detailed flowing narrative (15–20 lines) capturing every visible nuance — overall impression, materials, spatial qualities, light, atmosphere, and all distinguishing characteristics.",
  "RENDER_PROMPT_READY": "A ready-to-use image generation prompt synthesized from the analysis above, written in English, optimized for photorealistic architectural rendering, 3–5 lines."
}
No markdown, no extra text.`;
 
// ─── Prompt selector (normalized, with full category coverage) ───────────────
function selectPrompt(imageType: string): string {
  const t = imageType.trim().toUpperCase().replace(/\s+/g, "_");
 
  const map: Record<string, string> = {
    FLOOR_PLAN:      PROMPT_FLOOR_PLAN,
    SECTION:         PROMPT_SECTION,
    ELEVATION:       PROMPT_ELEVATION,
    SITE_PLAN:       PROMPT_SITE_PLAN,
    RENDER_3D:       PROMPT_3D,
    PHOTO:           PROMPT_3D,
    AXONOMETRIC:     PROMPT_3D,
    CONCEPT_SKETCH:  PROMPT_3D,
    DETAIL_DRAWING:  PROMPT_3D,
    MIXED:           PROMPT_3D,
  };
 
  return map[t] ?? PROMPT_GENERIC;
}
 
// ─── Normalize base64 image URL ───────────────────────────────────────────────
function normalizeImageUrl(base64Image: string): string {
  if (base64Image.startsWith("data:")) return base64Image;
  // Detect PNG by its base64 prefix (iVBOR) or default to jpeg
  if (base64Image.startsWith("iVBOR")) {
    return `data:image/png;base64,${base64Image}`;
  }
  return `data:image/jpeg;base64,${base64Image}`;
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
 
    const API_KEY =
      Deno.env.get("COMET_API_KEY") ||
      Deno.env.get("OPENAI_API_KEY") ||
      "test-key-replace-with-real-key";
    const API_MODEL =
      Deno.env.get("COMET_MODEL") ||
      Deno.env.get("OPENAI_MODEL") ||
      "gpt-4o";
    const API_BASE_URL =
      Deno.env.get("COMET_API_URL") || "https://api.cometapi.com";
 
    if (!API_KEY || API_KEY === "test-key-replace-with-real-key") {
      return new Response(
        JSON.stringify({
          error:
            "API_KEY não configurada. Adicione sua chave da API (CometAPI ou OpenAI) nas variáveis de ambiente do Supabase.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
 
    // Normalize image URL defensively before any API call
    const imageUrl = normalizeImageUrl(base64Image);
 
    const imagePayload = {
      type: "image_url",
      image_url: { url: imageUrl, detail: "high" },
    };
 
    // ── Step 1: Classify image type ───────────────────────────────────────────
    let imageType = "RENDER_3D";
 
    const classifyRes = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: API_MODEL,
        max_tokens: 20,
        messages: [
          { role: "system", content: SYSTEM_PERSONA },
          {
            role: "user",
            content: [
              imagePayload,
              { type: "text", text: CLASSIFIER_PROMPT },
            ],
          },
        ],
      }),
    });
 
    if (classifyRes.ok) {
      const classifyData = await classifyRes.json();
      imageType = (
        classifyData.choices?.[0]?.message?.content || "RENDER_3D"
      )
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
    } else {
      console.warn(
        "Classifier step failed — defaulting to RENDER_3D. Status:",
        classifyRes.status,
        await classifyRes.text().catch(() => "")
      );
    }
 
    // ── Step 2: Deep analysis with type-specific prompt ───────────────────────
    const analysisPrompt = selectPrompt(imageType);
 
    const analysisRes = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: API_MODEL,
        max_tokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PERSONA },
          {
            role: "user",
            content: [
              imagePayload,
              { type: "text", text: analysisPrompt },
            ],
          },
        ],
      }),
    });
 
    if (!analysisRes.ok) {
      const status = analysisRes.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Limite de requisições excedido. Tente novamente em alguns segundos.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (status === 401) {
        return new Response(
          JSON.stringify({
            error:
              "Chave da API inválida ou não configurada corretamente.",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const errorText = await analysisRes.text();
      console.error("Analysis API error:", status, errorText);
      throw new Error(`API error: ${status}`);
    }
 
    const data = await analysisRes.json();
    const content = data.choices?.[0]?.message?.content || "";
 
    // Strip markdown fences if model wraps response in ```json ... ```
    let jsonStr = content.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) jsonStr = fenceMatch[1].trim();
 
    let analysis: Record<string, unknown>;
    try {
      analysis = JSON.parse(jsonStr);
    } catch {
      // If JSON parse fails, preserve raw content and flag the issue
      analysis = {
        IMAGE_TYPE: imageType,
        FULL_DESCRIPTION: content,
        RENDER_PROMPT_READY: "",
        _parse_error:
          "Model returned non-JSON content — raw response preserved in FULL_DESCRIPTION",
      };
    }
 
    // Attach detected image type metadata
    analysis._detected_image_type = imageType;
 
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-image error:", e);
    return new Response(
      JSON.stringify({
        error:
          e instanceof Error ? e.message : "Erro ao analisar imagem",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
