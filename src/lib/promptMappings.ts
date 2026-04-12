// Prompt mappings - hidden from user, used internally for prompt generation

export const RENDER_TYPE_PROMPTS: Record<string, string> = {
  exterior: "exterior architectural render, building facade, landscaping view, outdoor perspective, street-level architectural visualization",
  interior: "interior architectural render, indoor space visualization, room perspective, interior design showcase",
  aerial: "aerial drone perspective, bird's eye architectural view, top-down angle, urban planning visualization",
  detail: "architectural detail close-up, material texture focus, construction detail visualization, macro architectural photography",
  section: "architectural section cut revealing internal spatial relationships, construction layers and material interfaces, technical drawing style with 3D depth",
  planta_humanizada: "photorealistic humanized floor plan, top-down architectural visualization, floor plan with furniture and materials, professional plan rendering with realistic textures",
};

export const LIGHTING_PROMPTS: Record<string, string> = {
  daylight: "bright daylight, clear blue sky, direct sunlight, sharp shadows, midday sun, vivid colors, crisp visibility",
  golden_hour: "golden hour lighting, warm orange and pink sky, long dramatic shadows, sun low on horizon, atmospheric depth, photorealistic render, cinematic color grading",
  night: "nighttime scene, artificial lighting, warm interior glow, starry sky, exterior architectural lighting, dramatic night atmosphere, moonlight accents",
  cloudy: "overcast sky, diffused soft lighting, even shadows, muted tones, gentle ambient light, cloud-covered atmosphere",
  rain: "rainy atmosphere, wet reflections on ground surfaces, puddles reflecting building, grey overcast sky, moody cinematic feel, glistening surfaces",
  dawn: "early morning dawn, soft pink and lavender sky, gentle mist, dewy surfaces, serene atmosphere, first light of day",
};

export const ENVIRONMENT_PROMPTS: Record<string, string> = {
  pool: "luxury swimming pool, crystal clear water, pool deck with lounge chairs, water reflections",
  garden: "lush landscaping, manicured garden, tropical vegetation, green lawn, landscape architecture",
  gourmet: "outdoor gourmet area, pergola structure, barbecue space, al fresco dining setup",
  garage: "vehicle entrance, driveway, modern garage door, car parking area",
  deck: "wooden deck flooring, terrace with wood planks, outdoor living space with natural wood",
  scenic_lighting: "architectural spot lighting, landscape illumination, uplighting on facade, garden light fixtures, warm ambient glow",
  fog: "atmospheric fog, morning mist, ethereal haze, volumetric lighting through fog, dreamlike atmosphere",
  water_mirror: "reflective water feature, mirror pool, still water reflection of building, architectural reflection pond",
};

export const SURROUNDING_PROMPTS: Record<string, string> = {
  residential: "residential neighborhood context, suburban atmosphere, single-family homes, quiet residential streets, family-friendly environment, well-maintained residential properties",
  commercial: "commercial urban context, business district atmosphere, office buildings, retail storefronts, commercial street activity, urban pedestrian environment",
  vegetation: "dense natural vegetation context, mature trees, lush landscaping, natural forest environment, botanical garden atmosphere, preserved natural landscape",
  buildings: "urban building context, high-rise buildings, office towers, apartment complexes, contemporary architectural projects, curtain wall systems, rooftop equipment",
  houses: "residential housing context, single-family homes, duplexes, townhouses, residential buildings, front yards, driveways, residential street infrastructure",
};

export const QUALITY_PROMPTS: Record<string, string> = {
  photorealistic: "hyper-photorealistic rendering, indistinguishable from photography, real-world materials, accurate light physics, photographic lens simulation",
  classic: "clean architectural render, soft shadow mapping, balanced exposure, professional visualization, neutral color palette",
  atmospheric: "editorial architectural photography style, dramatic depth of field, cinematic composition, moody atmosphere, magazine-quality render",
  minimalist: "minimalist rendering, clean white background, isolated subject, studio lighting, no environmental distractions, pure form showcase",
};

export const CAMERA_PROMPTS: Record<string, string> = {
  eye_level: "eye-level perspective, human height camera position, natural viewing angle, standard focal length, relatable scale",
  worm_eye: "worm's eye view, low angle camera, looking upward, monumental perspective, dramatic scale emphasis, towering presence",
  bird_eye: "bird's eye view, aerial overhead angle, top-down perspective, urban context visible, site plan view",
  dutch_angle: "dutch angle, tilted camera, diagonal composition, dynamic tension, dramatic cinematic framing",
  wide_angle: "wide-angle lens, expansive field of view, spatial depth emphasis, architectural grandeur, 14mm-24mm focal length simulation",
};

export const TECHNICAL_SUFFIX = "ultra-detailed architectural visualization, professional 3D rendering, award-winning architecture photography, 8K resolution, HDR, photorealistic materials, ray tracing, global illumination, architectural digest style, --ar 16:9 --q 2 --v 6";

export const HUMANIZATION_PROMPT_TEMPLATE = (description: string) =>
  `Add human figures to the scene: ${description}. People should look natural and integrated into the architectural setting, not posed or artificial. Photorealistic human presence, professionally dressed/casual, lifestyle photography style.`;

export const ANIMAL_PROMPT_TEMPLATE = (description: string) =>
  `Include animals in the scene: ${description}. Animals should appear natural and comfortable in the architectural environment, realistic fur/feather textures, candid animal photography style.`;

// Labels for the UI (Portuguese)
export const RENDER_TYPE_OPTIONS = [
  { id: "exterior", label: "Render Externo", desc: "Fachada / Paisagismo" },
  { id: "interior", label: "Render Interno", desc: "Interior / Ambientes" },
  { id: "aerial", label: "Render Aéreo", desc: "Drone / Vista Aérea" },
  { id: "detail", label: "Render de Detalhe", desc: "Close-up Arquitetônico" },
  { id: "section", label: "Render de Corte", desc: "Seção Arquitetônica" },
  { id: "planta_humanizada", label: "Planta Humanizada", desc: "Planta baixa humanizada" },
];

export const LIGHTING_OPTIONS = [
  { id: "daylight", label: "Diurno", desc: "Céu azul, luz solar direta" },
  { id: "golden_hour", label: "Entardecer", desc: "Luz quente e dramática" },
  { id: "night", label: "Noturno", desc: "Iluminação artificial" },
  { id: "cloudy", label: "Nublado", desc: "Luz difusa, céu encoberto" },
  { id: "rain", label: "Chuva", desc: "Reflexos, atmosfera cinza" },
  { id: "dawn", label: "Amanhecer", desc: "Tons rosados, névoa suave" },
];

export const ENVIRONMENT_OPTIONS = [
  { id: "pool", label: "Piscina" },
  { id: "garden", label: "Jardim / Paisagismo" },
  { id: "gourmet", label: "Área Gourmet" },
  { id: "garage", label: "Garagem" },
  { id: "deck", label: "Deck de Madeira" },
  { id: "scenic_lighting", label: "Iluminação Cênica" },
  { id: "fog", label: "Névoa / Neblina" },
  { id: "water_mirror", label: "Espelho d'Água" },
];

export const SURROUNDING_OPTIONS = [
  { id: "residential", label: "Residencial", desc: "Bairro residencial, casas" },
  { id: "commercial", label: "Comercial", desc: "Centro comercial, escritórios" },
  { id: "vegetation", label: "Vegetação", desc: "Floresta, vegetação densa" },
  { id: "buildings", label: "Prédios", desc: "Edifícios altos, torres" },
  { id: "houses", label: "Casas", desc: "Residências unifamiliares" },
];

export const QUALITY_OPTIONS = [
  { id: "photorealistic", label: "Fotorrealista", desc: "Hiper realismo fotográfico" },
  { id: "classic", label: "Clássico", desc: "Render limpo, sombras suaves" },
  { id: "atmospheric", label: "Atmosférico", desc: "Drama visual, editorial" },
  { id: "minimalist", label: "Minimalista", desc: "Fundo limpo, sem distração" },
];

export const CAMERA_OPTIONS = [
  { id: "eye_level", label: "Nível do Olho", desc: "Visão humana padrão" },
  { id: "worm_eye", label: "Olho de Verme", desc: "Câmera baixa" },
  { id: "bird_eye", label: "Olho de Pássaro", desc: "Vista aérea" },
  { id: "dutch_angle", label: "Ângulo Holandês", desc: "Ângulo diagonal" },
  { id: "wide_angle", label: "Ângulo Largo", desc: "Grande angular" },
];

// Analysis field labels for display
export const ANALYSIS_LABELS: Record<string, { label: string; icon: string }> = {
  IMAGE_TYPE: { label: "Tipo de Imagem", icon: "📷" },
  ARCHITECTURAL_STYLE: { label: "Estilo Arquitetônico", icon: "🏛️" },
  ENVIRONMENT: { label: "Ambiente", icon: "🌍" },
  MATERIALS: { label: "Materiais", icon: "🧱" },
  OBJECTS: { label: "Objetos", icon: "🪑" },
  LIGHTING: { label: "Iluminação", icon: "💡" },
  COLORS: { label: "Paleta de Cores", icon: "🎨" },
  TEXTURES: { label: "Texturas", icon: "🧶" },
  SPATIAL_COMPOSITION: { label: "Composição Espacial", icon: "📐" },
  ARCHITECTURAL_DETAILS: { label: "Detalhes Arquitetônicos", icon: "🏗️" },
  ATMOSPHERE: { label: "Atmosfera", icon: "✨" },
};
