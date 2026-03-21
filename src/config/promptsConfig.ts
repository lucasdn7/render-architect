export const SYSTEM_PERSONA = `You are a senior architect, urbanist, and interior designer with 20 years of experience, specialized in generating photorealistic AI image prompts for architectural renders. You have deep knowledge of 3D rendering, lighting techniques, materials, spatial composition, and photographic principles. You always write prompts in English, highly technical, optimized for Midjourney, DALL-E 3, and Adobe Firefly. Your prompts are precise, vivid, and produce award-winning architectural visualizations.`
 
export const RENDER_PROMPTS: Record<string, string> = {
 
  // ─────────────────────────────────────────────
  // TIPO DE RENDER
  // ─────────────────────────────────────────────
 
  render_geral: `Transform this 3D print into an ultra-photorealistic image, as if captured by a professional architectural photographer using a high-end DSLR/full-frame camera.
Mandatory rules (do not violate): maintain 100% of the original project without adding, removing or modifying any element. Do not alter materials, textures, colors, furniture, volumetry or layout. Do not replace cladding or reinterpret finishes. Do not add decorative objects, plants, people, extra lighting or artistic effects.
Visual objective: 100% photographic appearance, completely eliminating any render or illustration aspect. Natural and realistic lighting coherent with the original environment. Soft and physically correct shadows. Textures exactly matching the model, only with camera realism (sharpness, microcontrast and depth). Perspective and framing identical to the original print.
Technical quality: 4K resolution, high level of detail, slight realistic depth of field where applicable, neutral white balance and correct exposure.
Final expected result: an image indistinguishable from a real photograph, maintaining absolute fidelity to the original project, without any creative interference. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  render_externo: `Transform the attached SketchUp facade print into an extremely realistic photographic image, maintaining 100% of the original geometry, proportions and design, without altering volumes, openings or architectural elements.
Apply realistic materials and cladding with physically correct textures, natural reflections, subtle imperfections and real scale.
Realistic daytime lighting with blue sky, natural sunlight, soft and well-defined shadows according to solar position.
Add realistic context in the surroundings with discreet urban landscape, slightly blurred background houses, natural vegetation and coherent horizon, without stealing focus from the main facade.
Professional architectural photography style, realistic lens, balanced exposure, natural colors, high level of detail, appearance of a real photo, without render or illustration appearance.
Do not modify the original project: do not add, remove or alter facade elements. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  render_interno: `Convert this interior environment print (SketchUp) into a professional ultra-realistic interior photograph in 4K, as if captured by an architectural photographer with a high-end DSLR/full-frame camera.
Mandatory requirements: 100% photographic appearance, without render or illustration aspect. Extremely clear and balanced interior lighting with abundant natural light entering through openings, bright, sophisticated and airy environment. Perfect exposure without blown areas or excessive shadows. Maximum sharpness and precise focus, professional 4K photography quality. Realistic depth of field with subtle natural blur only where it would make sense in a real photo.
Absolute fidelity to the original project: DO NOT alter the architectural project under any circumstances. Maintain exactly the layout, proportions, angles, volumetry, furniture and composition. Do not add, remove or modify any element. Rigorously preserve the original image perspective.
Materials and textures: reproduce with photographic precision all project textures (wood, concrete, glass, metals, fabrics, stones, plants and cladding). Materials with reflections, subtle imperfections and real micro-details, without exaggeration.
Professional photographic treatment: natural and realistic colors, soft and elegant contrast, correct white balance, high-end interior photography style for magazines and professional portfolio.
Final objective: transform only the visual appearance of the render into a real photo, maintaining 100% identical design to the original file. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  render_aereo: `Aerial drone perspective view of the architectural project, bird's eye view, top-down overview, full site context and urban integration visible.
Maintain 100% of the original geometry, proportions and design of the project. Professional drone photography style, wide-angle lens, balanced exposure, natural colors, high level of detail, real photo appearance without render or illustration aspect.
Realistic aerial lighting coherent with the time of day, physically correct shadows from aerial perspective, natural vegetation and surroundings visible from above.
Ultra-detailed architectural visualization, professional aerial photography, 4K resolution, HDR, photorealistic materials. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  render_detalhe: `Architectural detail close-up of the specified element, material texture macro photography, construction detail focus, design element in extreme detail.
Maintain 100% fidelity to the original project materials and finishes. Professional macro architectural photography style, precise focus on the detail, realistic depth of field with natural background blur.
Physically correct textures with natural reflections, subtle imperfections and real micro-details. High-end detail photography, 4K resolution, neutral balanced lighting to reveal all material properties.
Final result: an image showcasing the architectural detail as a professional portfolio photograph, indistinguishable from real photography. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  planta_humanizada: `Transform this technical floor plan into a photorealistic humanized floor plan image with a high level of realism.
Respect 100% of the original architectural project, maintaining volumetry, proportions, layout, setbacks, openings and materials exactly as in the attached file, without adding, removing or modifying any element.
Apply realistic textures, humanized vegetation proportional to scale, natural shadows and balanced lighting.
Clean, professional and realistic render style with the appearance of a high-standard architectural presentation.
Do not reinterpret the project. Do not create new elements. Do not alter colors, shapes or materials. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  // ─────────────────────────────────────────────
  // PERÍODO DO DIA / ILUMINAÇÃO
  // ─────────────────────────────────────────────
 
  diurno_externo: `Realistic daytime lighting, blue sky, natural sunlight present, soft and well-defined shadows according to solar position, solar reflections physically precise, specular reflections and subtle caustics with light variation according to sun angle.
Balanced exposure adjustment, correct white balance and contrast simulating DSLR camera. Vivid natural colors, crisp visibility. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  diurno_interno: `Extremely clear and balanced interior lighting with abundant natural light entering through openings, bright, sophisticated and airy environment. Natural daytime lighting coherent with interior environment.
Perfect exposure without blown areas or excessive shadows. Correct white balance, neutral and realistic colors. High-end interior photography style. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  entardecer_externo: `Golden hour lighting with warm orange and amber tones, long dramatic shadows, sun low on horizon, cinematic atmosphere, sky gradient from pink to deep blue.
Specular reflections and warm natural light variation according to low sun angle. Balanced exposure, correct white balance for warm golden hour light. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  entardecer_interno: `Natural Golden Hour lighting with low sunlight entering through openings, creating warm, soft and realistic tones. Typical lateral light incidence of late afternoon with long, soft and well-defined shadows.
Perfect balance between natural external light and internal lighting, keeping the environment cozy, sophisticated and realistic. Exposure without blown areas or harsh shadows. Warm color palette natural to Golden Hour. White balance adjusted for warm late afternoon light. Glass with warm and realistic reflections of the late afternoon sky. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  noturno_externo: `Blue hour scenario with deep and soft blue sky, realistic ambient lighting and sophisticated atmosphere. Add warm white artificial lighting (3000K) on the facade, external areas and vegetation, creating balanced contrast between light and shadow with subtle and realistic glow.
Vegetation with natural appearance, scenically illuminated without exaggeration. Ultra realistic quality, correct global illumination, soft shadows, physically plausible reflections, slight depth of field, DSLR photography style, premium architectural render. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  noturno_interno: `Nighttime scene with no natural light. All artificial lights on with 3000K color temperature (warm white). Cozy, sophisticated and well-distributed lighting. Luminaires, spotlights, LED strips and indirect light with realistic effect without blown highlights.
Elegant and comfortable atmosphere typical of high-standard nighttime interior photography. Perfectly balanced exposure without blown areas or harsh shadows. Reflections and shadows coherent with nighttime artificial lighting. Natural and realistic colors under warm lighting (3000K). Soft, elegant and cinematic contrast. Correct white balance for nighttime artificial light. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  nublado: `Realistic diffused natural lighting of an overcast day, light grey sky, no direct sun and no harsh shadows. Correct exposure adjustment, white balance and contrast simulating DSLR camera.
Include realistic details such as slight material usage marks, subtle depth of field and photographic sharpness. Hyper-realistic style, contemporary architecture, ultra high quality, render with real photo appearance. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  chuva: `Rainy day scene, completely overcast sky, diffused and soft light, no direct sun and no harsh shadows. Realistic water reflections on floor and surfaces. Atmospheric realism: slight rain effect in the environment without exaggeration, visible humidity in materials, natural and slightly desaturated colors typical of rainy climate.
Professional architectural photography style, 35mm lens, realistic perspective, high sharpness, natural lighting, subtle post-processing. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  amanhecer: `Sunrise soft lighting, pastel pink and lavender sky, low morning mist, gentle warm golden light, serene and peaceful atmosphere. Soft and well-defined shadows according to low sunrise solar position.
Balanced exposure, correct white balance for soft warm morning light. Natural and realistic colors in the awakening light palette. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  // ─────────────────────────────────────────────
  // ELEMENTOS DO AMBIENTE
  // ─────────────────────────────────────────────
 
  piscina: `Convert this 3D print into a professional ultra-realistic architectural photograph as if captured by a specialized architectural photographer using a high-end DSLR/full-frame camera, 4K resolution.
Swimming pool area: masonry pool with realistic tile or mosaic cladding, crystal clear water with transparency, reflections and gentle natural undulation. Daytime scene with blue clear sky, natural sunlight and soft natural shadows, realistic solar lighting with precise physical reflections on pool water. Specular reflections, subtle caustics and light variation according to sun angle.
External deck in natural wood or porcelain tile with texture and real wear. Realistic sun loungers, natural fabric umbrella and sophisticated external furniture. Absolute restriction: do not alter architecture, volumetry, proportions or layout of the original project. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  jardim: `Professional tropical landscaping, lush manicured garden, ornamental plants, curated green areas, mature trees providing natural shade. Realistic vegetation with natural colors, physically correct leaf textures, subtle imperfections and natural scale.
Natural lighting coherent with environment, realistic shadows cast by vegetation, depth and layering in planting composition. Landscape photography style, high level of botanical detail, photorealistic organic materials. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  area_gourmet: `Covered outdoor gourmet area, pergola or shade structure, built-in BBQ kitchen, outdoor dining setup with table and chairs, ambient string lighting for atmosphere.
Realistic materials: natural wood for pergola and furniture, natural stone or porcelain countertops, stainless steel appliances. Warm and balanced lighting coherent with gourmet environment. High-end lifestyle photography style, sophisticated residential ambiance. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  garagem: `Vehicle access driveway, garage entrance portal, paved approach with realistic floor texture. Architectural car portal detail with precise material finishes. Realistic vehicles where visible, natural lighting coherent with facade.
Professional architectural photography style focused on the entrance composition, high level of material detail, real photo appearance. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  deck: `Natural hardwood deck with rich timber grain texture, realistic weathering and tonal variation of real wood. Outdoor lounge furniture integrated naturally into the deck composition.
Seamless indoor-outdoor transition visible in the framing. Warm natural lighting enhancing wood tones, physically correct reflections on smooth surfaces, depth of field focused on the deck material detail. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  iluminacao_cenica: `Dramatic architectural uplighting on facade, precision spotlights highlighting architectural volumes, garden path lighting with subtle glows, LED strip accents on architectural details, light sculpture effect through deliberate shadow and light contrast.
Warm white (3000K) lighting temperature throughout, balanced without blown highlights, sophisticated nighttime atmosphere. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  nevoa: `Morning atmospheric fog, ethereal mist layers around lower vegetation and ground, soft depth haze reducing background visibility naturally, dreamlike and serene quality.
Diffused soft lighting coherent with foggy morning atmosphere, muted color palette with cool blue-grey tones, reduced contrast and visibility depth creating natural layers of depth. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  espelho_dagua: `Still water mirror pool with perfect architectural reflection, zen reflecting pool perfectly integrated into the architectural composition. Horizontal water feature with crystal still surface.
Natural reflections of sky and architecture on the water surface, subtle caustic light patterns, realistic water material with slight surface tension visible. IMPORTANT: Do not alter any texture or format of the original base image.`,
 
  // ─────────────────────────────────────────────
  // QUALIDADE / ESTILO DO RENDER
  // ─────────────────────────────────────────────
 
  fotorrealista: `Hyper-photorealistic render indistinguishable from real photography. Ray tracing with global illumination, accurate light physics and photographic lens simulation.
Extremely realistic textures with physically correct materials, natural reflections, subtle imperfections and real micro-details. Correct exposure, neutral white balance and natural contrast. 8K resolution, professional DSLR photography appearance, without any render, CGI or illustration aspect.`,
 
  classico: `Clean professional architectural render, soft and balanced shadows, architectural digest presentation style. Neutral and elegant rendering without dramatic effects.
Balanced and correct lighting, natural colors, refined and professional visual quality for portfolio and professional presentation. Ultra high quality, clean render with real photo appearance.`,
 
  atmosferico: `Atmospheric editorial render with dramatic depth of field, cinematic color grading, moody directional lighting. Magazine cover quality photographic treatment.
Sophisticated color palette, elegant and cinematic contrast, directional lighting creating depth and drama. Premium architectural photography style, worthy of top architecture publications.`,
 
  minimalista: `Minimalist pure white or light neutral backdrop, completely distraction-free architectural focus. Clean neutral environment with product photography style clarity.
Perfect and balanced lighting without strong shadows, pure and natural colors, maximum focus on architectural form and materials. High-end minimalist presentation quality.`,
 
  // ─────────────────────────────────────────────
  // CÂMERA / PERSPECTIVA
  // ─────────────────────────────────────────────
 
  eye_level: `Eye level perspective, natural human viewpoint at standard standing height. 35mm lens equivalent, relatable human scale, standard natural field of view. Perspective and framing identical to the original reference image.`,
 
  worm_eye: `Low angle dramatic shot, worm's eye view from ground level, strong upward perspective emphasizing architectural height and monumentality. Sky dominant in composition, dramatic upward convergence of vertical lines.`,
 
  bird_eye: `Aerial bird's eye view, overhead composition showing full site layout, full site context and urban integration visible. Top-down architectural overview revealing spatial organization and site relationship.`,
 
  dutch_angle: `Dynamic dutch angle with deliberate camera tilt, diagonal composition creating visual tension and drama. Tilted horizon line conveying energy and architectural dynamism.`,
 
  wide_angle: `Ultra wide angle lens 16mm to 24mm, expansive spatial view capturing full architectural context. Slight controlled barrel distortion, full environment capture including sky and surroundings.`,
 
  // ─────────────────────────────────────────────
  // SUFIXO TÉCNICO UNIVERSAL
  // ─────────────────────────────────────────────
 
  suffix: `Ultra-detailed architectural visualization, professional 3D rendering, award-winning architecture photography, HDR imaging, photorealistic PBR materials, Architectural Digest quality standard, absolute fidelity to the original project, 4K resolution, DSLR photography style. --ar 16:9 --q 2 --v 6.1`
 
}
 
// ─────────────────────────────────────────────
// MAPEAMENTO: combinações render + iluminação
// Usado internamente para selecionar o prompt correto
// conforme tipo de render + período selecionados
// ─────────────────────────────────────────────
 
export const PROMPT_COMBINATIONS: Record<string, string> = {
  "render_externo+diurno":      RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.diurno_externo,
  "render_externo+entardecer":  RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.entardecer_externo,
  "render_externo+noturno":     RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.noturno_externo,
  "render_externo+nublado":     RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.nublado,
  "render_externo+chuva":       RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.chuva,
  "render_externo+amanhecer":   RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.amanhecer,
  "render_interno+diurno":      RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.diurno_interno,
  "render_interno+entardecer":  RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.entardecer_interno,
  "render_interno+noturno":     RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.noturno_interno,
  "render_interno+nublado":     RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.nublado,
  "render_interno+chuva":       RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.chuva,
  "render_interno+amanhecer":   RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.amanhecer,
}
 
// ─────────────────────────────────────────────
// HUMANIZAÇÃO
// ─────────────────────────────────────────────
 
export const HUMANIZATION_PROMPT = (pessoas: string, animais: string) => `
Add lifestyle humanization to the architectural scene:
${pessoas ? `Human presence: ${pessoas}. People must look completely natural, candid lifestyle photography style, well-integrated into the architectural setting, not posed or artificial, photorealistic human figures with realistic clothing, skin tones and natural body language, appropriate scale to architecture, no plastic or synthetic appearance.` : ""}
${animais ? `Animal presence: ${animais}. Animals in natural relaxed behavior, photorealistic fur/skin textures, harmoniously integrated into the landscape, correct scale to environment, natural posture and expression.` : ""}
All humanization elements must be indistinguishable from a real photograph. Do not alter the original architecture, layout or materials.
