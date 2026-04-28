// @ts-nocheck
// Supabase Edge Function — generate-prompt
// Otimizado para Nano Banana Pro (Gemini 3 Pro Image)
// O frontend envia as chaves selecionadas e a descrição da imagem base.
// Esta função resolve os blocos, mescla via IA e retorna o prompt final enxuto.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// ─────────────────────────────────────────────
// SYSTEM PROMPT — instrui a IA a sintetizar, não concatenar
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

// ─────────────────────────────────────────────
// FIDELITY CONSTRAINT — condensado, direto, uma vez só
// Nano Banana já preserva geometria nativamente; reforço mínimo e cirúrgico
// ─────────────────────────────────────────────

const FIDELITY_CONSTRAINT = `Apply all rendering, lighting, and material changes strictly to elements present in the base image. Do not add, remove, or alter any architectural element, opening, structural feature, or spatial configuration. Do not render dimension lines, annotations, section symbols, room labels, or any technical drawing notation. Vegetation may be enhanced or added freely provided it does not obscure the architecture. Preserve all proportions, angles, and geometry exactly as shown in the base image.`;

// ─────────────────────────────────────────────
// POST-PROCESSING SUFFIX — parâmetros técnicos compactos
// Removidos flags Midjourney (--v, --ar, etc.) — inválidos no Nano Banana Pro
// ─────────────────────────────────────────────

const SUFFIX = `Post-processing: full-frame sensor simulation, neutral LUT with slight warm bias, medium-format sharpness output, 3% film grain, subtle lens vignette, no HDR halo artifacts, no blown highlights, full shadow detail retained.`;

// ─────────────────────────────────────────────
// RENDER PROMPTS — reescritos para Nano Banana Pro
// Princípios: técnicos, sem redundância de fidelidade, 40–70 palavras por bloco
// ─────────────────────────────────────────────

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

const MANDATORY_CATEGORIES = ["render", "iluminacao", "estilo"];
const ORDERED_CATEGORIES = ["render", "iluminacao", "estilo", "ambiente", "entorno"];

const INCOMPATIBLE_PAIRS: [string, string, string][] = [
  ["render_interno", "render_aereo", "Não é possível renderizar vista aérea de interiores."],
  ["render_interno", "entorno_residencial", "Entorno residencial não visível em renders internos."],
  ["render_interno", "entorno_comercial", "Entorno comercial não visível em renders internos."],
  ["render_corte", "render_aereo", "Corte e vista aérea são perspectivas incompatíveis."],
  ["planta_humanizada", "render_aereo", "Planta humanizada e vista aérea são perspectivas incompatíveis."],
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchWithTimeout(url: string, options: any, timeout = 30000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { selectedKeys, imageDescription, humanizationText } = await req.json();

    if (!Array.isArray(selectedKeys) || typeof imageDescription !== "string") {
      return new Response(
        JSON.stringify({ error: "Parâmetros inválidos." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Validação: categorias obrigatórias ───────────────────────────────────
    for (const category of MANDATORY_CATEGORIES) {
      const hasSelection = PROMPT_CATEGORIES[category].some((key) =>
        selectedKeys.includes(key)
      );
      if (!hasSelection) {
        return new Response(
          JSON.stringify({
            error: `É obrigatório selecionar ao menos uma opção da categoria: ${category}.`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ── Validação: máximo de uma seleção por categoria obrigatória ────────────
    for (const category of MANDATORY_CATEGORIES) {
      const selectedInCategory = PROMPT_CATEGORIES[category].filter((key) =>
        selectedKeys.includes(key)
      );
      if (selectedInCategory.length > 1) {
        return new Response(
          JSON.stringify({
            error: `Apenas uma opção pode ser selecionada para a categoria: ${category}. Selecionadas: ${selectedInCategory.join(", ")}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ── Validação: pares incompatíveis ───────────────────────────────────────
    for (const [keyA, keyB, reason] of INCOMPATIBLE_PAIRS) {
      if (selectedKeys.includes(keyA) && selectedKeys.includes(keyB)) {
        return new Response(
          JSON.stringify({ error: `Combinação incompatível: ${reason}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // ── Validação: máximo de 2 blocos de entorno ─────────────────────────────
    const entornoKeys = selectedKeys.filter((k: string) =>
      k.startsWith("entorno_")
    );
    if (entornoKeys.length > 2) {
      return new Response(
        JSON.stringify({
          error: `Máximo de 2 blocos de entorno permitidos. Recebidos: ${entornoKeys.join(", ")}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Resolução dos blocos ─────────────────────────────────────────────────
    const resolvedBlocks: string[] = [];
    const unknownKeys: string[] = [];
    const emptyAmbienteKeys: string[] = [];

    const selectedBlocksByCategory: Record<string, string[]> = {};
    for (const category of ORDERED_CATEGORIES) {
      selectedBlocksByCategory[category] = [];
    }

    for (const key of selectedKeys) {
      let foundCategory = false;
      for (const category of ORDERED_CATEGORIES) {
        if (PROMPT_CATEGORIES[category].includes(key)) {
          const blockText = RENDER_PROMPTS[key]?.trim() ?? "";
          if (blockText === "") {
            emptyAmbienteKeys.push(key);
          } else {
            selectedBlocksByCategory[category].push(
              `[${key.toUpperCase()}]\n${blockText}`
            );
          }
          foundCategory = true;
          break;
        }
      }
      if (!foundCategory) {
        unknownKeys.push(key);
      }
    }

    for (const category of ORDERED_CATEGORIES) {
      if (selectedBlocksByCategory[category].length > 0) {
        resolvedBlocks.push(...selectedBlocksByCategory[category]);
      }
    }

    if (resolvedBlocks.length === 0) {
      return new Response(
        JSON.stringify({
          error: `Nenhum bloco com conteúdo válido encontrado. Chaves inválidas: ${unknownKeys.join(", ")}${emptyAmbienteKeys.length > 0 ? `. Ambientes sem prompt configurado: ${emptyAmbienteKeys.join(", ")}` : ""}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Configuração da API ──────────────────────────────────────────────────
    const API_KEY =
      Deno.env.get("COMET_API_KEY") ||
      Deno.env.get("OPENAI_API_KEY") ||
      "";

    const API_MODEL = "claude-sonnet-4-6";

    const API_BASE_URL =
      Deno.env.get("COMET_API_URL") || "https://api.cometapi.com";

    if (!API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "API_KEY não configurada. Adicione sua chave nas variáveis de ambiente do Supabase (COMET_API_KEY).",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Montagem do user message ─────────────────────────────────────────────
    const selectedBlocksText = resolvedBlocks.join("\n\n");

    const humanizationSection = humanizationText?.trim()
      ? `\nPEOPLE/ANIMALS (include only if explicitly described — do not invent): ${humanizationText.trim()}`
      : "";

    const userMessage =
      `BASE_IMAGE_DESCRIPTION (sole reference for what exists in the scene):\n${imageDescription.trim()}\n\n` +
      `RENDERING BLOCKS TO SYNTHESIZE:\n${selectedBlocksText}${humanizationSection}\n\n` +
      `FIDELITY_CONSTRAINT (append verbatim as final paragraph):\n${FIDELITY_CONSTRAINT}\n\n` +
      `POST_PROCESSING (append verbatim after synthesized body, before FIDELITY_CONSTRAINT):\n${SUFFIX}\n\n` +
      `TASK: Synthesize the RENDERING BLOCKS into a single concise technical prompt of 150–280 words. ` +
      `Write flowing technical prose. Extract unique intent from each block, eliminate all redundancy. ` +
      `Suppress any geometry-specific instruction from a block if that element is absent from BASE_IMAGE_DESCRIPTION — apply only its lighting/atmospheric quality generically. ` +
      `Structure: [synthesized body] → [POST_PROCESSING verbatim] → [FIDELITY_CONSTRAINT verbatim]. ` +
      `Output only the final prompt text — no preamble, no explanation, no markdown.`;

    // ── Chamada da API (Claude via CometAPI) ──────────────────────────────────
    let mergedPrompt = "";

    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/messages`,
      {
        method: "POST",
        headers: {
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: API_MODEL,
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          messages: [
            { role: "user", content: userMessage },
          ],
        }),
      }
    );

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 401) {
        return new Response(
          JSON.stringify({ error: "Chave da API inválida ou não configurada corretamente." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text().catch(() => "");
      console.error("Anthropic API error:", status, errorText);
      throw new Error(`API error: ${status}`);
    }

    const data = await response.json();
    mergedPrompt =
      data.content
        ?.filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text)
        .join("")
        .trim() ?? "";

    // ── Validação da resposta ────────────────────────────────────────────────
    if (!mergedPrompt) {
      throw new Error("O modelo retornou uma resposta vazia.");
    }

    // ── Monta lista de chaves efetivamente usadas ────────────────────────────
    const usedKeys = selectedKeys.filter((k: string) => {
      for (const category of ORDERED_CATEGORIES) {
        if (
          PROMPT_CATEGORIES[category].includes(k) &&
          (RENDER_PROMPTS[k]?.trim() ?? "") !== ""
        ) {
          return true;
        }
      }
      return false;
    });

    return new Response(
      JSON.stringify({
        prompt: mergedPrompt,
        usedKeys,
        ...(unknownKeys.length > 0 && { ignoredKeys: unknownKeys }),
        ...(emptyAmbienteKeys.length > 0 && {
          pendingAmbientes: emptyAmbienteKeys,
        }),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e) {
    console.error("generate-prompt error:", e);
    return new Response(
      JSON.stringify({
        error:
          e instanceof Error
            ? e.message
            : "Erro interno ao gerar prompt",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
