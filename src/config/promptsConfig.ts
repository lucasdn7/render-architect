export const SYSTEM_PERSONA = `You are a senior architect, urbanist, and interior designer with 20 years of experience, specialized in generating photorealistic AI image prompts for architectural renders. You have deep knowledge of 3D rendering, lighting techniques, materials, spatial composition, and photographic principles. You always write prompts in English, highly technical, optimized for Midjourney, DALL-E 3, and Adobe Firefly. Your prompts are precise, vivid, and produce award-winning architectural visualizations.`

export const RENDER_PROMPTS: Record<string, string> = {
  render_externo: "exterior architectural visualization, facade view, full building elevation, outdoor environment, landscaping context",
  render_interno: "interior architectural visualization, indoor living space, room perspective view, interior design showcase, furniture and decor details",
  render_aereo: "aerial drone perspective, bird's eye view, top-down architectural overview, urban context visible",
  render_detalhe: "architectural detail close-up, material texture macro, construction detail, design element focus",

  diurno: "bright daylight, clear blue sky, direct sunlight, sharp defined shadows, midday sun position, vivid natural colors, crisp visibility",
  entardecer: "golden hour lighting, warm orange amber tones, long dramatic shadows, sun low on horizon, cinematic atmosphere, sky gradient pink to deep blue",
  noturno: "nighttime scene, architectural artificial lighting, illuminated windows glow, landscape spotlights, dark dramatic sky, high contrast light and shadow",
  nublado: "overcast sky, soft diffused lighting, no harsh shadows, even neutral illumination, moody grey atmosphere, muted tones",
  chuva: "rainy atmosphere, wet reflective ground surfaces, puddle mirror reflections, rain streaks, grey melancholic sky, dramatic contrast",
  amanhecer: "sunrise soft lighting, pastel pink lavender sky, low morning mist, gentle warm golden light, serene peaceful atmosphere",

  piscina: "luxury swimming pool, crystal clear turquoise water, infinity edge pool, pool deck with lounge chairs, caustic light patterns, water surface reflections",
  jardim: "professional tropical landscaping, lush manicured garden, ornamental plants, curated green areas, mature trees providing shade",
  area_gourmet: "covered outdoor gourmet area, pergola structure, built-in BBQ kitchen, outdoor dining setup, ambient string lighting",
  garagem: "vehicle access driveway, garage entrance, paved approach, car portal architectural detail",
  deck: "natural hardwood deck, timber decking texture, outdoor lounge furniture, seamless indoor-outdoor transition",
  iluminacao_cenica: "dramatic architectural uplighting, facade spotlights, garden path lighting, LED strip accents, light sculpture effect",
  nevoa: "morning atmospheric fog, ethereal mist layers, soft depth haze, dreamlike quality, reduced visibility depth",
  espelho_dagua: "still water mirror pool, perfect reflection of architecture, zen reflecting pool, horizontal water feature",

  fotorrealista: "hyper-photorealistic render, indistinguishable from real photography, ray tracing, global illumination, accurate light physics, photographic lens simulation, 8K resolution",
  classico: "clean professional architectural render, soft balanced shadows, architectural digest style, neutral presentation",
  atmosferico: "atmospheric editorial render, dramatic depth of field, cinematic color grading, moody directional lighting, magazine cover quality",
  minimalista: "minimalist pure white backdrop, distraction-free architectural focus, clean neutral environment, product photography style",

  eye_level: "eye level perspective, natural human viewpoint, 35mm lens, relatable human scale, standard field of view",
  worm_eye: "low angle dramatic shot, worm eye view, strong upward perspective, monumental architectural scale, sky dominant",
  bird_eye: "aerial bird eye view, overhead composition, full site context, urban integration visible",
  dutch_angle: "dynamic dutch angle, diagonal composition, tilted camera, tension and drama",
  wide_angle: "ultra wide angle lens, 16mm to 24mm, expansive spatial view, slight barrel distortion, full environment capture",

  suffix: "ultra-detailed architectural visualization, professional 3D rendering, award-winning architecture photography, HDR imaging, photorealistic PBR materials, Architectural Digest quality standard, --ar 16:9 --q 2 --v 6.1"
}

export const HUMANIZATION_PROMPT = (pessoas: string, animais: string) => `
Add lifestyle humanization to the architectural scene:
${pessoas ? `Human presence: ${pessoas}. People must look completely natural, candid lifestyle photography style, well-integrated into the architectural setting, not posed or artificial, photorealistic human figures, appropriate scale to architecture.` : ''}
${animais ? `Animal presence: ${animais}. Animals in natural relaxed behavior, photorealistic, harmoniously integrated into the landscape.` : ''}
`
