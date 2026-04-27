// @ts-nocheck
// Supabase Edge Function — generate-prompt
// O frontend envia as chaves selecionadas (ex: ["render_externo", "diurno", "fotorrealista", "eye_level"])
// Esta função resolve os textos, mescla com a descrição da imagem via IA e retorna o prompt final.
 
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
 
// ─────────────────────────────────────────────
// SYSTEM / MERGE INSTRUCTIONS
// ─────────────────────────────────────────────
 
const SYSTEM_PERSONA = `You are a "Render Fidelity AI", an expert in photorealistic architectural visualization. Your ABSOLUTE PRIMARY DIRECTIVE is geometric and spatial fidelity to the base image provided. You must NEVER add, remove, resize, relocate, or alter any architectural element, window, door, opening, pool, wall, roof, column, or structural feature that is not explicitly present in the BASE_IMAGE_DESCRIPTION. Your role is strictly to apply photorealistic rendering qualities — textures, lighting, materials, atmosphere, and camera parameters — to the EXACT geometry described in the base image, without any creative reinterpretation of the architecture itself. Deviation from the original geometry is a critical failure.`;
 
const MASTER_MERGE_PROMPT = `As an expert AI prompt merging system for architectural visualization, your task is to combine selected prompt blocks into a single, coherent, and highly effective rendering prompt. Your PRIMARY CONSTRAINT — which overrides all others — is that the final prompt must instruct the rendering AI to apply photorealistic qualities ONLY to the geometry and elements already present in the base image. No new architectural elements, features, or spatial configurations may be introduced.
 
Follow this strict hierarchical order and conflict resolution strategy:
 
1. TIPO DE RENDER (Mandatory - Select ONE): Defines rendering intent and global quality. Must never instruct the AI to alter or supplement the original architectural geometry.
2. PERÍODO DO DIA/ILUMINAÇÃO (Mandatory - Select ONE): Defines global lighting, color temperature, sky, and atmospheric effects. Applied to existing geometry only.
3. QUALIDADE / ESTILO DO RENDER (Mandatory - Select ONE): Reinforces style and quality directives, PBR materials, global illumination. Applied to existing surfaces only.
4. ELEMENTOS DO AMBIENTE (Optional - Select ZERO or MORE): Introduces detailed material and lighting properties for elements ALREADY PRESENT in the base image. Must not introduce new elements not described in BASE_IMAGE_DESCRIPTION.
5. ENTORNO (Optional - Select ZERO or MORE, maximum TWO): Defines surrounding context. Must match and respect the existing context described in the base image, without adding context not present.
6. AMBIENTES INTERNOS (Optional - Select ZERO or MORE): Interior environment details for rooms ALREADY SHOWN in the base image only.
7. CÂMERA / PERSPECTIVA (Mandatory - Select ONE): Camera parameters, lens, perspective, depth of field. Cannot alter what is in the scene, only how it is viewed.
8. SUFIXO DE RENDERIZAÇÃO (Mandatory - Always append at the end): High-fidelity rendering and post-processing instructions. Must be appended verbatim.
9. BLOCO DE PRESERVAÇÃO NEGATIVA (Mandatory - Always append at the end): Geometric preservation instructions. Must be appended verbatim, without modification.`;
 
const MERGE_AGENT = `GEOMETRIC FIDELITY RULES (ABSOLUTE — override everything else):
0. NEVER instruct the AI renderer to add, create, generate, or introduce any element not explicitly described in BASE_IMAGE_DESCRIPTION. If a pool is not in the base image, do not reference pool rendering. If a window is not in the base image, do not mention window materials. If vegetation is not in the base image, do not add vegetation. Only apply material, lighting, and texture instructions to elements confirmed present in the base image.
0b. When resolving ELEMENTOS DO AMBIENTE blocks: if the base image does not contain that element (e.g., pool, deck, garden), suppress all geometry-specific instructions from that block and apply only the lighting and atmospheric quality directives generically.
 
MERGING RULES:
1. Hierarchical Priority: Camera > Lighting > Surroundings > Global Style for conflicting instructions.
2. Intelligent Merging: Concatenate prompts fluidly, technically precise, avoiding unnecessary repetition.
3. Conflict Resolution:
   • Camera: Camera block always prevails over lens/angle suggestions from other blocks.
   • Lighting: Lighting block always prevails over lighting suggestions from other blocks.
   • PBR Materials: Apply only to surfaces confirmed present in BASE_IMAGE_DESCRIPTION.
4. Geometric Preservation: The NEGATIVE PRESERVATION BLOCK is absolute. Append verbatim at the end.
5. Entorno blocks: Merge harmoniously up to two blocks. Surrounding context must not contradict or supplement the actual surroundings described in the base image with invented elements.
6. Interior Environments: Apply room-level details only to rooms confirmed in the base image.
7. Final Output: A single prompt text ready for an AI image generator, optimized for photorealism and strict architectural fidelity. The prompt must repeatedly reinforce that the original geometry is immutable.`;
 
// ─────────────────────────────────────────────
// SUFFIX
// ─────────────────────────────────────────────
 
const SUFFIX = `Camera simulation: full-frame sensor, 35mm prime lens, F5.6 aperture, ISO 100, 1/250s, correct exposure metering with no blown highlights and full shadow detail retained. Color grading: neutral LUT with slight warm bias, contrast curve lifted at midtones, no artificial saturation boost. Output sharpness equivalent to medium-format architectural photography. Subtle film grain at 3%, real lens vignette, no HDR halo artifacts. The final image must achieve maximum photorealistic quality while rendering ONLY the architectural elements, materials, and spatial configuration present in the original base model — no additions, no creative interpolations, no invented context.`;
 
// ─────────────────────────────────────────────
// NEGATIVE PROMPT
// ─────────────────────────────────────────────
 
const NEGATIVE_PROMPT = `CRITICAL FIDELITY CONSTRAINT: DO NOT CREATE, ADD, GENERATE, OR INTRODUCE any architectural element, spatial feature, furniture piece, vegetation item, water feature, vehicle, person, or any other object that is not explicitly and unambiguously present in the original base image provided. The base image is the sole and absolute reference for what exists in the scene. Rendering quality is applied only to existing elements — never used as justification to supplement or complete the scene.
 
DO NOT ALTER, MODIFY, OR DEVIATE FROM THE ORIGINAL 3D MODEL GEOMETRY. The architectural form, massing, proportions, window placements, door locations, roof pitches, and all structural elements as defined in the base image are ABSOLUTE AND IMMUTABLE. Do not add, remove, or resize any part of the building. Do not change the architectural style. Do not introduce new architectural features not present in the original design. The AI's role is strictly limited to applying photorealistic textures, lighting, atmospheric effects, and vegetation enhancements to the existing, unchanged geometry.
 
DO NOT RENDER 2D drawing elements such as plans, sections, elevations, dimensions, furniture symbols, annotations, or any other drafting elements. Exclude all documentary or technical drawing representations. Preserve the 3D architectural geometry (walls, roofs, windows) rigidly.
 
FOR 2D ARCHITECTURAL DRAWINGS (floor plans, sections, elevations, facades, and any other technical drawing type): STRICTLY preserve all spaces, rooms, environments, and architectural elements exactly as described and represented in the source image — including their geometry, proportions, spatial relationships, and layout. The environments depicted in the drawing are ABSOLUTE and must not be altered, reinterpreted, or omitted. However, ALL documentary and technical annotation layers must be completely removed from the final output: this includes, without exception, all dimension lines, dimension text, section cut indicators, schematic cut symbols, north arrows, scale bars, room labels, area tags, material callouts, hatching legends, grid lines, grid bubbles, level markers, detail reference bubbles, revision clouds, title blocks, drawing borders, stamps, logos, watermarks, and any other written text or graphic notation of a technical or documentary nature. The final rendered image must present ONLY the pure architectural geometry and its photorealistic materials — a clean visual output entirely free of any documentation, annotation, or technical drawing overlay.
 
Vegetation is the sole exception to the no-addition rule: landscaping elements such as trees, shrubs, ground cover, grass, planters, hedges, and other vegetation blocks may be freely replaced, enhanced, added, or removed to improve realism and visual quality — provided they do not obscure, distort, or conflict with the legibility of the architectural geometry.
 
Preserve all geometric and proportional integrity of the original design without exception. Deformed, distorted, warped, melted, or unrealistic architectural forms are strictly forbidden. Ensure all lines remain straight, all circles perfectly circular, and all architectural angles are rendered with perfect precision as designed.`;
 
// ─────────────────────────────────────────────
// RENDER PROMPTS
// Merged: prompts mais detalhados do Doc 4 onde aplicável,
// estrutura de categorias e validações do Doc 5.
// ─────────────────────────────────────────────
 
const RENDER_PROMPTS: Record<string, string> = {
 
  // ─── TIPO DE RENDER ───────────────────────────────────────────────────────
 
  render_externo: `Apply hyper-photorealistic rendering to the existing residential or commercial facade geometry exactly as modeled, emulating professional architectural photography. STRICTLY preserve 100% of the original volumetry, proportions, and design — no alterations to architectural forms, openings, or compositional elements. Apply exposure, white balance, and contrast adjustments to mimic a full-frame DSLR camera with a 24mm tilt-shift lens, ensuring perfectly corrected verticals. Render only the materials, textures, and lighting conditions onto the existing geometry.`,
 
  render_interno: `Apply hyper-photorealistic rendering to the existing interior architectural geometry exactly as modeled, emulating professional interior design photography. STRICTLY preserve 100% of the spatial layout, ceiling heights, openings, furniture placement, and all architectural proportions without any modification. Apply exposure, white balance, and depth of field to simulate a DSLR camera with a 24mm wide-angle lens at eye level (1.2m height), ensuring natural perspective. Render only the materials and lighting onto the existing spatial configuration.`,
 
  render_aereo: `Apply hyper-photorealistic rendering to the existing full site geometry exactly as modeled, emulating professional cinematic drone photography. STRICTLY preserve 100% of the site layout, roof geometry, landscaping footprint, and all architectural volumes — no alterations. Apply exposure, white balance, and color grading to mimic a high-end drone camera at 80 meters altitude, 45-degree oblique angle, with precise perspective foreshortening and corrected lens distortion. Render only what is present in the original model.`,
 
  // Doc 4 version — more precise macro lens spec for detail renders
  render_detalhe: `Apply hyper-photorealistic rendering to the existing architectural detail geometry exactly as modeled, emulating professional macro architectural photography. STRICTLY preserve 100% of the original geometry of the detail being shown (e.g., material junction, window reveal, structural connection, facade joint, canopy edge) — no modifications to form or proportion. Apply exposure and depth of field to mimic a DSLR camera with an 85mm macro lens at F2.0, with a razor-sharp focus plane precisely on the primary detail surface. Render only materials and textures onto the existing geometry.`,
 
  render_corte: `Apply hyper-photorealistic rendering to the existing architectural section geometry exactly as modeled, emulating a professional cut-through visualization. STRICTLY preserve 100% of the section geometry, floor-to-floor heights, slab thicknesses, wall depths, stair configurations, and spatial relationships between internal environments as drawn. The cut plane MUST remain exactly as defined in the original, with no reinterpretation or closing of any opening created by the section cut. Apply camera simulation to a DSLR positioned perfectly perpendicular to the cut plane, with a true orthographic or near-orthographic perspective, ensuring the full section height is in frame and free of perspective distortion. IMPORTANT: All spaces, rooms, and environments depicted in the section must be faithfully preserved and rendered with photorealistic materials and lighting. The final output must be completely free of any technical annotation, text, dimension lines, section cut symbols, level markers, grid references, or any other documentary graphic element — present only the pure architectural section geometry with photorealistic quality.`,
 
  planta_humanizada: `Apply hyper-photorealistic humanized rendering to the existing floor plan geometry exactly as modeled, emulating a professional top-down architectural visualization. STRICTLY preserve 100% of the original floor plan geometry (wall positions, room dimensions, door and window openings, circulation paths, spatial layout) — no modifications whatsoever. Apply rendering to simulate a perfectly vertical overhead camera, with zero perspective distortion (true orthographic projection), and even, diffuse global illumination from above, mimicking a studio lighting setup. IMPORTANT: All spaces, rooms, and environments depicted in the floor plan must be faithfully preserved and rendered with photorealistic materials, furniture, and finishes appropriate to each room's function — only where furniture is already shown in the original plan. The final output must be completely free of any technical annotation, text, dimension lines, room labels, area tags, north arrows, scale bars, grid lines, section cut indicators, or any other documentary graphic element — present only the pure architectural plan geometry with photorealistic humanized quality.`,
 
  // ─── PERÍODO DO DIA / ILUMINAÇÃO ─────────────────────────────────────────
 
  diurno: `Apply crisp, bright midday natural daylight with the sun at a high elevation (approximately 65-75 degrees above the horizon). Color temperature precisely at 5600K (daylight white balance). Simulate advanced global illumination and ray tracing to produce sharp, well-defined directional shadows on the existing architectural surfaces. The sky should be rendered as a vibrant, clear deep blue with subtle atmospheric scattering and one or two photorealistic, scattered cumulus clouds. Ensure full ambient bounce light from the ground plane and surrounding PBR surfaces, accurately filling shadow areas with soft, physically accurate secondary illumination and subtle color bleeding. All existing facade materials should receive direct solar radiation with precise PBR specular and diffuse response. Ensure no overexposure on brightly lit surfaces while retaining full detail and dynamic range in shadow zones.`,
 
  entardecer: `Apply exquisite golden hour natural lighting with the sun positioned precisely at 8-10 degrees above the horizon, with a warm color temperature gradually dropping from 3500K to 2500K. All existing west and south-facing PBR surfaces should be bathed in rich, warm amber and orange light, exhibiting realistic subsurface scattering for foliage and translucent materials. East-facing surfaces should be in cool blue shadow, softly illuminated by the ambient sky fill. Cast dramatically long, raking shadows stretching across the ground plane, intensely emphasizing surface texture, relief, and micro-details of the existing geometry. The sky should be rendered as a breathtaking gradient from deep burnt orange at the horizon, transitioning through vibrant magenta and rose pink, to a serene cobalt blue at the zenith, with subtle atmospheric haze and volumetric light rays. Specular highlights should be intensely pronounced on existing glazed surfaces, polished metals, and water features present in the original model, showcasing accurate Fresnel reflections.`,
 
  noturno: `Apply immersive full nighttime lighting conditions with a deep indigo to near-black sky, featuring a subtle, realistic star texture and a soft, cool moonlight contribution as secondary fill. All exterior artificial light sources ALREADY PRESENT in the original model must be rendered with physically accurate IES light profiles. Interior spaces already present should glow warmly through existing glazed surfaces, casting soft, inviting interior light onto adjacent exterior floor planes. Render all existing light sources with natural bloom, lens flare, and realistic falloff, ensuring no clipping or overexposure on bulb sources. Deep shadow zones should exhibit only soft, ambient spill from nearby existing fixtures, with rich, dark tones but retaining subtle detail. Color temperature of artificial sources should be precisely between 2700K and 3000K (warm white).`,
 
  nublado: `Apply soft, diffused overcast sky lighting conditions with a dense, full cloud cover acting as an expansive natural diffusion panel. Color temperature precisely at 6500K (cool daylight). Simulate advanced global illumination to ensure zero hard shadows anywhere in the scene; instead, all existing PBR surfaces should receive soft, directionless, even illumination simultaneously, revealing subtle form and texture of the original geometry. The sky should be rendered as a uniform, silver-white to light gray overcast layer with nuanced tonal variation and volumetric depth between cloud masses. All existing material colors should be rendered at their most accurate and saturated, free from the interference of direct sunlight or harsh shadow contrast.`,
 
  chuva: `Apply a dramatic, active rainstorm atmosphere with a dark, brooding mid-gray stratocumulus overcast sky. Render hyper-realistic fine rain streaks as diagonal motion blur across the full frame. All existing horizontal PBR surfaces must be covered in a thin, highly reflective water film, producing mirror-like specular reflections of the sky, facade, and all existing light sources. Photorealistic puddles should accumulate in low points and joints of the existing geometry. Existing facade glazing should be realistically streaked with water rivulets running vertically, exhibiting accurate refraction and distortion. The ambient light should be flat, desaturated, and cool (precisely 6800K). All existing artificial light sources must be rendered with intensely amplified bloom and volumetric light shafts from moisture in the air.`,
 
  amanhecer: `Apply ethereal pre-sunrise dawn lighting with the sun not yet visible above the horizon. The sky should be rendered as a magnificent, layered gradient: deep charcoal at the zenith, gracefully transitioning through soft rose pink, delicate peach, and pale lavender, descending toward the horizon where a warm, backlit, and intensely luminous glow is present. The overall scene should be softly illuminated by a cool (precisely 4200K) indirect sky dome light, ensuring no direct solar shadows are cast on the existing geometry. Introduce a subtle, low atmospheric ground haze at 0.5 to 1.0 meter height. Existing vegetation should show photorealistic dew clinging to surfaces. All existing facade surfaces should receive a cool, soft, directional fill light emanating from the horizon zone.`,
 
  // ─── QUALIDADE / ESTILO DO RENDER ────────────────────────────────────────
 
  fotorrealista: `Final render quality: hyper-photorealistic, 8K ultra-high resolution, physically-based rendering (PBR) pipeline with bidirectional scattering distribution function (BSDF) for all existing materials, unbiased ray-traced global illumination (GI) and path-traced reflections/refractions, accurate Fresnel response on existing glass and polished surfaces, micro-surface roughness variation on existing matte materials for realistic light diffusion, advanced sub-surface scattering (SSS) on existing organic elements. Camera simulation: emulating a Canon EOS R5 with a calibrated 35mm prime lens, F4 aperture, ISO 200, scientifically accurate exposure metering and dynamic range mapping. Post-processing: subtle film grain at 4%, slight vignette, chromatic aberration consistent with real-world lens optics, and bloom/glare effects for existing light sources. All quality enhancements applied strictly to the existing geometry and materials — no new elements introduced.`,
 
  classico: `Final render quality: impeccable academic architectural presentation standard, neutral color grading with a subtle warm bias, soft, diffused shadows with no extreme contrast or mood manipulation, all existing materials rendered with technical accuracy and full PBR color fidelity, balanced symmetric or harmonious composition, sky neutral and non-distracting (e.g., clear blue or evenly overcast), existing vegetation rendered as calm, well-defined green masses with accurate PBR leaf textures. Global Illumination (GI) and Physically Based Lighting (PBL) ensure even illumination and accurate material response on existing surfaces only. Output equivalent to AIA portfolio submission or RIBA award documentation quality, emphasizing clarity, precision, and timeless aesthetic.`,
 
  atmosferico: `Final render quality: cinematic editorial grade, strong foreground-to-background depth layering applied to the existing scene composition, lifted blacks and crushed highlights for dramatic tonal range, rich color grading with intentional mood bias, deep shadow zones with selective ambient fill, composition utilizing the existing strong lines and volumes of the architecture. Advanced volumetric lighting and atmospheric effects (e.g., fog, haze, dust motes) applied to the existing scene to enhance mood. Global Illumination (GI) and Physically Based Lighting (PBL) meticulously controlled for emotional impact. Output equivalent to Dezeen, ArchDaily, or Wallpaper* architectural editorial photography standard.`,
 
  minimalista: `Final render quality: stripped-back minimalist presentation, existing architecture rendered against a neutral pale or white overcast sky, ground plane in uniform light tone with minimal PBR texture variation, all contextual distraction reduced to near zero, color palette limited to the existing architecture's own material range with no supplementary color. Composition centered with generous negative space, emphasizing the clean lines and geometric forms of the original design. Existing vegetation if present reduced visually to calm, restrained masses with accurate PBR leaf textures and subtle subsurface scattering. Global Illumination (GI) and Physically Based Lighting (PBL) provide even, soft illumination, highlighting the architectural purity of the existing design.`,
 
  // ─── ELEMENTOS DO AMBIENTE ────────────────────────────────────────────────
 
  piscina: `For the existing pool present in the original model: apply physically based rendering (PBR) tile or mosaic cladding with subtle grout lines, micro-imperfections, and accurate material reflectivity to the existing pool surfaces. The existing water must be rendered crystal clear, exhibiting physically accurate transparency, refraction, and subsurface scattering for realistic depth, with gentle, natural surface undulation. Simulate dynamic, precise caustics on the existing pool floor and walls. The existing external deck surfaces should be rendered with PBR natural wood or high-quality porcelain tile, showcasing realistic grain, texture, subtle wear, and accurate reflections. Apply photorealistic materials to existing sun loungers, furniture, and umbrella elements already present in the model.`,
 
  jardim: `For the existing garden and vegetation areas present in the original model: apply physically based rendering (PBR) foliage to existing vegetation, showcasing natural, vibrant colors, physically correct leaf textures with subtle imperfections (e.g., veins, slight wilting, dew drops), and accurate natural scale. Simulate advanced subsurface scattering for existing leaves and petals. Ensure natural lighting coherent with the environment, producing realistic, soft-edged shadows cast by existing vegetation. Apply botanical detail and photorealistic organic materials to existing planting elements only.`,
 
  // Doc 4 version — richer material detail spec
  area_gourmet: `For the existing gourmet area present in the original model: apply ambient string lighting with realistic light falloff and subtle bloom for a warm, inviting atmosphere to existing light fixture locations. Apply physically based rendering (PBR) materials to existing elements — natural wood for existing pergola and furniture with authentic grain and subtle weathering, natural stone or high-quality porcelain to existing countertops with accurate reflectivity and micro-imperfections, brushed stainless steel to existing appliances with anisotropic reflections. Ensure warm and balanced global illumination coherent with a high-end gourmet environment.`,
 
  garagem: `For the existing garage and approach area present in the original model: apply physically based rendering (PBR) floor texture (e.g., concrete, pavers, asphalt) to the existing paved approach with subtle wear, tire marks, and accurate reflectivity. Apply precise PBR material finishes (e.g., brushed metal, textured concrete, natural wood) to the existing architectural car portal detail. If vehicles are already present in the original model, render them with accurate paint reflections, subtle dust, and realistic tire textures. Ensure natural global illumination coherent with the existing facade lighting.`,
 
  deck: `For the existing deck area present in the original model: apply hyper-realistic natural hardwood rendering to the existing deck surface, showcasing a rich, authentic timber grain texture, realistic weathering (e.g., subtle fading, water stains, micro-scratches), and natural tonal variation, all with physically based rendering (PBR) properties. Apply PBR fabrics and materials to existing outdoor lounge furniture already in the model. Ensure warm, natural global illumination that enhances the existing wood tones.`,
 
  iluminacao_cenica: `For the existing nighttime scene with existing architectural lighting elements: apply dramatic, hyper-realistic uplighting rendering to existing facade light fixture positions, utilizing precision spotlights with accurate IES profiles to dynamically highlight the existing architectural volumes and textures. Apply subtle, warm rendering to existing garden path lighting with soft glows and realistic light falloff. Apply elegant LED strip accent rendering to existing architectural detail light positions. All existing artificial light sources should emit a consistent warm white light (precisely 3000K), with physically accurate bloom, lens flare, and volumetric light shafts.`,
 
  nevoa: `Apply a captivating morning atmospheric fog effect to the existing scene, featuring ethereal mist layers gracefully enveloping lower areas of the existing site and ground plane. Introduce a soft, volumetric depth haze that naturally reduces background visibility of existing elements, creating a dreamlike and serene quality. The lighting should be diffused, soft, and coherent with a foggy morning atmosphere. Employ a muted color palette dominated by cool blue-grey tones applied to the existing scene elements, with subtly desaturated hues and reduced contrast.`,
 
  espelho_dagua: `For the existing reflecting pool or water mirror feature present in the original model: apply hyper-realistic still water rendering to the existing horizontal water feature surface, functioning as a zen reflecting pool. The existing water surface should exhibit physically accurate mirror-like reflections of the sky, existing surrounding architecture, and any existing light sources. Simulate subtle, dynamic caustic light patterns on the existing pool floor. Apply physically based rendering (PBR) water material to the existing feature, showcasing realistic transparency, refraction, and a visible, delicate surface tension.`,
 
  // ─── ENTORNO ─────────────────────────────────────────────────────────────
 
  entorno_residencial: `Render the surrounding residential context that is already visible or implied in the base image — neighboring houses, low-rise buildings, front yards, garden walls, fences, parked vehicles, sidewalks, and residential street infrastructure — all at hyper-photorealistic fidelity consistent with the scale and character of the primary building. Apply accurate PBR material variation to existing surrounding structures. All surrounding context subordinate in visual hierarchy to the primary architectural subject, rendered with slightly reduced sharpness and depth-of-field falloff toward the background to reinforce depth and focus. Do not introduce surrounding context elements that contradict or are absent from the base image.`,
 
  entorno_comercial: `Render the surrounding commercial urban context already visible or implied in the base image — mid to high-rise office buildings, retail facades, signage, commercial streetscape, wide paving, vehicle traffic, pedestrian flow, street furniture, and urban infrastructure — all at hyper-photorealistic fidelity consistent with the density and character of the existing setting. Apply accurate PBR material variation to existing surrounding buildings. Urban background rendered with correct atmospheric haze and depth falloff. Do not introduce surrounding context elements that contradict or are absent from the base image.`,
 
  entorno_vegetacao: `Render the surrounding natural landscape context already visible or implied in the base image — existing mature trees, forest edge, dense vegetation layers, ground cover, wild grasses, shrubs, and organic terrain — all at hyper-photorealistic fidelity with species-appropriate silhouette, accurate PBR leaf translucency, and natural color variation. Existing vegetation rendered with accurate response to the active lighting conditions. Background vegetation fading into atmospheric depth with correct color desaturation and contrast reduction toward the horizon. Do not introduce natural landscape elements that contradict or are absent from the base image.`,
 
  entorno_predios: `Render the surrounding mid and high-rise building context already visible or implied in the base image — existing apartment towers, mixed-use residential blocks, commercial ground floors, and dense urban street infrastructure — all at hyper-photorealistic fidelity. Apply accurate PBR facade material variation to existing surrounding buildings. Rooftop silhouettes of surrounding towers layered against sky in correct perspectival recession, distant buildings fading into atmospheric haze. Do not introduce surrounding buildings or urban context elements that contradict or are absent from the base image.`,
 
  entorno_casas: `Render the surrounding residential house context already visible or implied in the base image — existing single-family homes, low perimeter walls, front gardens, driveways, garage doors, mailboxes, sidewalks, and residential street details — all at hyper-photorealistic fidelity. Apply individual PBR material variation to existing neighboring houses. Existing front yards with their existing planted gardens, lawn areas, and trees rendered with photorealistic quality. All surrounding houses rendered with natural weathering, while remaining visually subordinate to the primary architectural subject. Do not introduce surrounding houses or residential context elements that contradict or are absent from the base image.`,
 
  // ─── CÂMERA / PERSPECTIVA ─────────────────────────────────────────────────
 
  eye_level: `Camera positioned at standard human eye level, precisely 1.6 meters above the ground plane, with a horizontal sight line perfectly parallel to the floor, replicating a natural standing-person perspective. Focal length calibrated to 35mm to 50mm (full-frame equivalent), accurately mirroring the natural human field of vision with zero vertical distortion (achieved via tilt-shift simulation or post-correction). The ground plane is visibly present in the lower third of the frame, the sky or ceiling occupies the upper third, and the existing architectural subject fills the entire vertical middle zone. Physically Based Camera (PBC) model ensures accurate depth of field, motion blur (if applicable), and lens characteristics.`,
 
  worm_eye: `Camera positioned extremely low, between 10 to 20 centimeters above the ground plane, with the lens tilted sharply upward toward the existing building. This creates strong converging vertical lines running from the base of the existing building upward, dramatically exaggerating building height and structural mass. The ground plane occupies the foreground as a dominant, richly textured surface in sharp PBR detail. The sky fills a large proportion of the upper frame, emphasizing the scale of the existing architecture. Existing overhangs, soffits, the underside of existing balconies, cantilevered volumes, and structural columns become primary compositional elements. Focal length calibrated to 20mm to 24mm (full-frame equivalent). Physically Based Camera (PBC) model ensures accurate depth of field and lens characteristics.`,
 
  bird_eye: `Camera positioned directly overhead or at a high oblique angle between 60 and 90 degrees downward, simulating an aerial or elevated observation point. The full existing site footprint is visible — existing roof planes, terraces, landscaping, pool, driveway, surrounding context, and street geometry are all readable simultaneously. Existing roof materials, parapet details, rooftop equipment, and plan organization are legible with PBR accuracy from above. Focal length calibrated to 24mm to 35mm (full-frame equivalent). This angle communicates the existing site strategy, massing logic, roof design, and the relationship of the existing building to its surroundings. Physically Based Camera (PBC) model ensures accurate depth of field and lens characteristics.`,
 
  dutch_angle: `Camera rotated on its longitudinal axis between 15 and 35 degrees from horizontal, producing a deliberate diagonal tilt across the entire frame. The horizon line runs diagonally rather than horizontally, and all existing vertical architectural elements — columns, walls, window frames — are rendered at an angle relative to the frame edges. This creates visual tension, dynamic energy, and cinematic unease using the existing architectural composition. Focal length calibrated to 24mm to 35mm (full-frame equivalent). Physically Based Camera (PBC) model ensures accurate depth of field and lens characteristics.`,
 
  wide_angle: `Camera fitted with an ultra-wide angle lens equivalent to 14mm to 20mm focal length (full-frame equivalent), capturing an expanded horizontal and vertical field of view of the existing scene in a single frame. Precisely controlled barrel distortion or deliberately corrected rectilinear perspective depending on desired artistic effect. The existing foreground elements appear larger and more prominent relative to existing background elements, exaggerating spatial depth and distance between near and far planes of the existing composition. Focal length capturing the full existing building width plus existing surrounding context within a single composition. Physically Based Camera (PBC) model ensures accurate depth of field and lens characteristics.`,
 
  // ─────────────────────────────────────────────
  // AMBIENTES INTERNOS — 15 ambientes
  // ─────────────────────────────────────────────
 
  ambiente_quarto_principal: `For the existing master bedroom present in the original model: camera positioned at 1.0 meter height, slightly below standard eye level, reinforcing the horizontal intimacy of the existing sleeping environment. Focal length equivalent to 24mm to 35mm, wide enough to capture the existing full depth of the room from entry zone to headboard wall. Apply lighting as soft and directional — primary natural light entering from the existing dominant window source, producing a gentle gradient across existing horizontal surfaces. Apply warm secondary contributors at 2700K to existing bedside and ceiling light sources. Atmosphere intimate, calm — no harsh contrast, shadow zones retaining full detail and texture of existing surfaces. Depth of field subtle, existing background elements slightly softened.`,
 
  ambiente_quarto_hospedes: `For the existing guest bedroom present in the original model: camera positioned at standard eye level of 1.6 meters, centered on the existing room's primary sleeping axis. Focal length equivalent to 24mm to 28mm, capturing full existing room width and depth in a single frame. Apply clean and neutral lighting — balanced natural light from existing windows providing even ambient illumination, supplemented by existing ceiling fixture at 3000K. Atmosphere fresh, welcoming — soft shadows, moderate contrast, all existing surfaces evenly lit. Depth of field flat, all existing planes from foreground to background in sharp focus, prioritizing spatial legibility.`,
 
  ambiente_banheiro: `For the existing bathroom present in the original model: camera positioned at 1.4 meters height, lens axis horizontal, positioned to capture the existing full vanity and mirror wall as primary focal element with spatial depth extending toward existing shower or bath zone in background. Focal length equivalent to 20mm to 24mm to maximize perceived spatial generosity. Apply high specular accuracy rendering to existing mirror surfaces, existing glazed ceramic and porcelain surfaces, and existing chrome and brushed metal fixtures. Apply primary light rendering at existing overhead downlights at 3000K supplemented by existing vanity mirror lighting at 2700K. Apply steam or moisture atmosphere as subtle humidity haze on existing glass surfaces where contextually appropriate.`,
 
  // Doc 4 version — richer spec with "selective illumination" detail
  ambiente_lavabo: `For the existing powder room present in the original model: camera positioned at 1.2 to 1.4 meters height, tight framing centered on the existing vanity unit and mirror as the singular focal composition. Focal length equivalent to 28mm to 35mm, controlled framing that captures the existing space. Apply dramatic and intentional lighting — accent lighting on existing mirror perimeter, downlight on existing countertop surface, strong specular response on all existing reflective surfaces including mirror, basin, tap fixtures, and wall cladding. Atmosphere sophisticated and moody with higher contrast — deeper shadow zones acceptable and desirable, highlights on existing fixtures and basin intentionally pronounced. Color temperature warm at 2700K to 3000K. Selective illumination reinforces the premium, intimate character of the existing space.`,
 
  ambiente_sala_estar: `For the existing living room present in the original model: camera positioned at 1.1 to 1.2 meters height, slightly below standard eye level. Focal length equivalent to 24mm to 35mm, wide enough to capture the existing full social zone — existing sofa grouping, coffee table, TV wall or feature wall, and connection to adjacent areas. Apply lighting with multiple simultaneous sources — dominant natural light from existing large window or glazed opening, existing ceiling fixtures at 3000K, existing floor and table lamps at 2700K. Atmosphere relaxed, warm — moderate contrast, rich shadow detail, all existing upholstery and textile surfaces rendered with accurate fabric softness. Depth of field with existing foreground furniture in sharp focus.`,
 
  ambiente_sala_jantar: `For the existing dining room present in the original model: camera positioned at 1.0 to 1.2 meters height, axis directed toward the existing dining table as the undisputed compositional anchor. Focal length equivalent to 28mm to 35mm, framing the existing full table length with surrounding existing chairs and existing pendant light fixture overhead. Apply lighting with existing pendant fixture above the table as the dominant source — warm 2700K downward pool of light on existing table surface with strong specular response on existing tabletop material and existing tableware where present. Apply natural light from existing adjacent window as secondary contributor. Atmosphere convivial and warm with focused intimacy.`,
 
  ambiente_cozinha: `For the existing kitchen present in the original model: camera positioned at 1.4 to 1.6 meters height, axis directed along the existing primary work counter run to capture full existing cabinetry elevation, countertop surface, and depth toward existing opposing wall or island unit. Focal length equivalent to 24mm to 28mm. Apply functional and bright lighting — existing recessed ceiling downlights at 4000K providing even task illumination across existing countertop surfaces, existing under-cabinet LED strip lighting at 3000K washing the existing work surface. Apply accurate specular response to all existing horizontal surfaces. Atmosphere clean, precise — high ambient light level, minimal shadow drama, all existing surface materials rendered with crisp detail.`,
 
  ambiente_copa: `For the existing breakfast nook or copa present in the original model: camera positioned at 1.4 meters height, intimate framing centered on the existing coffee or beverage preparation zone. Focal length equivalent to 35mm to 50mm. Apply warm and inviting lighting — existing pendant or under-cabinet lighting at 2700K as dominant source over the existing preparation surface. Apply natural light from existing small window as soft secondary contributor if present. Atmosphere deliberately casual and domestic — lower ambient light level, richer shadow depth on existing surfaces, warm color temperature bias throughout.`,
 
  ambiente_home_theater: `For the existing home theater present in the original model: camera positioned at 1.0 meters height, axis directed toward the existing screen wall as the primary vanishing point. Focal length equivalent to 24mm to 28mm, capturing full existing room width and seating depth. Apply controlled and theatrical lighting — intentionally low ambient level, primary light sources being existing bias lighting behind existing screen at 6500K and existing LED accent strips at 2700K along existing floor and ceiling perimeters. Existing seating area in rich shadow with soft fill. Existing screen rendered as active light source. Atmosphere immersive and cinematic — deep shadow zones, every existing surface rendered with acoustic panel texture and fabric seating accurate response to minimal light.`,
 
  ambiente_escritorio: `For the existing home office present in the original model: camera positioned at 1.2 to 1.4 meters height, axis directed toward the existing primary desk and work surface. Focal length equivalent to 28mm to 35mm, capturing the existing full desk run, existing shelving or storage behind, and existing window relationship to the work zone. Apply task-accurate lighting — natural daylight from existing lateral window as dominant source, positioned to minimise screen glare, supplemented by existing desk lamp at 3500K. Apply existing ceiling ambient at 4000K as neutral fill. Atmosphere focused and productive — moderate contrast, clean even illumination on existing work surfaces. Existing monitor screen rendered as active light source.`,
 
  ambiente_biblioteca: `For the existing library present in the original model: camera positioned at 1.4 to 1.6 meters height, axis directed to capture the existing full height of bookshelf walls as the dominant architectural element. Focal length equivalent to 24mm to 35mm, wide enough to read the full vertical extent of the existing shelving wall alongside existing seating or reading zone in foreground. Apply warm and layered lighting — existing recessed ceiling spots at 3000K washing existing bookshelf faces, existing reading chair supplemented by existing floor lamp at 2700K, natural light from existing window as cool lateral contributor. Atmosphere scholarly, quiet — deep warm shadows between existing shelf volumes, existing paper and book spine textures rendered with full surface detail.`,
 
  ambiente_area_jogos: `For the existing games area present in the original model: camera positioned at 1.2 meters height, wide framing capturing the existing full activity zone with all existing functional elements — existing game tables, seating, entertainment units, and circulation space. Focal length equivalent to 20mm to 24mm. Apply bright, even, and energetic lighting — high ambient light level from existing ceiling fixtures at 3500K to 4000K, no dominant shadow zones, all existing activity surfaces well-illuminated. Atmosphere dynamic and informal — higher contrast than a living room, existing surfaces rendered with their wear-resistant material finishes.`,
 
  ambiente_varanda: `For the existing varanda present in the original model: camera positioned at 1.4 to 1.6 meters height at the existing threshold between interior and exterior, axis directed outward to capture both the existing covered varanda structure overhead and the existing view or garden beyond as background. Focal length equivalent to 24mm to 35mm. Apply lighting as a transition between interior shadow and exterior brightness — existing covered ceiling zone in rich shadow with soft ambient fill from reflected exterior light, existing floor surface receiving dappled or directional light from existing open sides, existing exterior view rendered at correct exposure for outdoor daylight conditions. Atmosphere of sheltered openness rendered through this existing light transition.`,
 
  ambiente_terraco: `For the existing terrace present in the original model: camera positioned at 1.6 meters height, fully exterior and open to sky, axis directed across the existing terrace surface toward the horizon, view, or primary architectural backdrop. Focal length equivalent to 24mm to 35mm, capturing existing foreground floor surface, existing mid-ground furniture or landscape elements, and background sky or urban context. Apply fully exterior lighting — no overhead structure filtering light (unless present in the original model), full sky dome illumination active, direct solar contribution from correct sun position. Existing floor surface receiving full direct or diffuse exterior light with accurate shadow casting from any existing furniture, planters, or vertical elements.`,
 
  ambiente_area_servico: `For the existing service area present in the original model: camera positioned at 1.6 meters height, functional framing capturing the existing full working length of the service area — existing laundry run, utility storage, and circulation zone. Focal length equivalent to 24mm to 28mm. Apply functional and utilitarian lighting — existing ceiling fluorescent or LED panel at 4000K to 5000K providing flat, even, shadowless illumination across all existing work surfaces. Atmosphere clean, bright, and operationally honest — high color rendering index light accurately representing existing material colors, all existing surfaces rendered with the practical, durable finishes of a high-use utility space. Existing ventilation grilles, pipe runs, and utility connections rendered with technical accuracy.`,
};
 
// ─────────────────────────────────────────────
// CATEGORIAS — estrutura do Doc 5
// ─────────────────────────────────────────────
 
const PROMPT_CATEGORIES: Record<string, string[]> = {
  "TIPO DE RENDER": ["render_externo", "render_interno", "render_aereo", "render_detalhe", "render_corte", "planta_humanizada"],
  "PERÍODO DO DIA / ILUMINAÇÃO": ["diurno", "entardecer", "noturno", "nublado", "chuva", "amanhecer"],
  "QUALIDADE / ESTILO DO RENDER": ["fotorrealista", "classico", "atmosferico", "minimalista"],
  "ELEMENTOS DO AMBIENTE": ["piscina", "jardim", "area_gourmet", "garagem", "deck", "iluminacao_cenica", "nevoa", "espelho_dagua"],
  "ENTORNO": ["entorno_residencial", "entorno_comercial", "entorno_vegetacao", "entorno_predios", "entorno_casas"],
  "AMBIENTES INTERNOS": [
    "ambiente_quarto_principal", "ambiente_quarto_hospedes", "ambiente_banheiro", "ambiente_lavabo",
    "ambiente_sala_estar", "ambiente_sala_jantar", "ambiente_cozinha", "ambiente_copa",
    "ambiente_home_theater", "ambiente_escritorio", "ambiente_biblioteca", "ambiente_area_jogos",
    "ambiente_varanda", "ambiente_terraco", "ambiente_area_servico",
  ],
  "CÂMERA / PERSPECTIVA": ["eye_level", "worm_eye", "bird_eye", "dutch_angle", "wide_angle"],
};
 
const MANDATORY_CATEGORIES = [
  "TIPO DE RENDER",
  "PERÍODO DO DIA / ILUMINAÇÃO",
  "QUALIDADE / ESTILO DO RENDER",
  "CÂMERA / PERSPECTIVA",
];
 
const ORDERED_CATEGORIES = [
  "TIPO DE RENDER",
  "PERÍODO DO DIA / ILUMINAÇÃO",
  "QUALIDADE / ESTILO DO RENDER",
  "ELEMENTOS DO AMBIENTE",
  "ENTORNO",
  "AMBIENTES INTERNOS",
  "CÂMERA / PERSPECTIVA",
];
 
// ─────────────────────────────────────────────
// PARES INCOMPATÍVEIS
// ─────────────────────────────────────────────
 
const INCOMPATIBLE_PAIRS: [string, string, string][] = [
  ["bird_eye",    "render_interno",    "Vista aérea (bird_eye) não é compatível com render interno."],
  ["worm_eye",    "render_interno",    "Vista de verme (worm_eye) não é compatível com render interno."],
  ["dutch_angle", "planta_humanizada", "Ângulo holandês (dutch_angle) não é compatível com planta humanizada."],
  ["bird_eye",    "planta_humanizada", "Vista aérea (bird_eye) não é compatível com planta humanizada — use a câmera overhead da planta."],
  ["worm_eye",    "planta_humanizada", "Vista de verme (worm_eye) não é compatível com planta humanizada."],
  ["worm_eye",    "render_aereo",      "Vista de verme (worm_eye) não é compatível com render aéreo."],
  ["eye_level",   "render_aereo",      "Nível do olho (eye_level) não é compatível com render aéreo — use bird_eye."],
];
 
// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
 
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
 
// ─── Fetch with timeout helper ────────────────────────────────────────────────
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 55_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
 
// ─────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────
 
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
 
  try {
    const { imageDescription, selectedKeys, humanizationText } = await req.json();
 
    // ── Validação: imageDescription ───────────────────────────────────────
    if (!imageDescription || typeof imageDescription !== "string" || imageDescription.trim() === "") {
      return new Response(
        JSON.stringify({ error: "imageDescription é obrigatório e deve ser uma string não vazia." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
 
    // ── Validação: selectedKeys ───────────────────────────────────────────
    if (!Array.isArray(selectedKeys) || selectedKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: "selectedKeys deve ser um array com ao menos uma chave válida." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
 
    // ── Validação: categorias obrigatórias presentes ──────────────────────
    for (const category of MANDATORY_CATEGORIES) {
      const hasSelection = PROMPT_CATEGORIES[category].some((key) => selectedKeys.includes(key));
      if (!hasSelection) {
        return new Response(
          JSON.stringify({ error: `É obrigatório selecionar ao menos uma opção da categoria: ${category}.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
 
    // ── Validação: máximo de 1 seleção por categoria obrigatória ──────────
    for (const category of MANDATORY_CATEGORIES) {
      const selectedInCategory = PROMPT_CATEGORIES[category].filter((key) => selectedKeys.includes(key));
      if (selectedInCategory.length > 1) {
        return new Response(
          JSON.stringify({
            error: `Apenas uma opção pode ser selecionada para a categoria: ${category}. Selecionadas: ${selectedInCategory.join(", ")}`,
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
 
    // ── Validação: pares incompatíveis ────────────────────────────────────
    for (const [keyA, keyB, reason] of INCOMPATIBLE_PAIRS) {
      if (selectedKeys.includes(keyA) && selectedKeys.includes(keyB)) {
        return new Response(
          JSON.stringify({ error: `Combinação incompatível: ${reason}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
 
    // ── Validação: máximo de 2 blocos de entorno ──────────────────────────
    const entornoKeys = selectedKeys.filter((k) => k.startsWith("entorno_"));
    if (entornoKeys.length > 2) {
      return new Response(
        JSON.stringify({
          error: `Máximo de 2 blocos de entorno permitidos. Recebidos: ${entornoKeys.join(", ")}`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
 
    // ── Resolve e ordena os blocos hierarquicamente ───────────────────────
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
            selectedBlocksByCategory[category].push(`[${key.toUpperCase()}]\n${blockText}`);
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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
 
    // ── Config da API ─────────────────────────────────────────────────────
    const API_KEY =
      Deno.env.get("COMET_API_KEY") ||
      Deno.env.get("OPENAI_API_KEY") ||
      "";
    const API_MODEL =
      Deno.env.get("COMET_MODEL") ||
      Deno.env.get("OPENAI_MODEL") ||
      "gpt-4o"; // gpt-4o — mais capaz para merge complexo
    const API_BASE_URL =
      Deno.env.get("COMET_API_URL") || "https://api.cometapi.com";
 
    if (!API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "API_KEY não configurada. Adicione sua chave nas variáveis de ambiente do Supabase (COMET_API_KEY ou OPENAI_API_KEY).",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
 
    // ── Monta system e user message ───────────────────────────────────────
    const systemContent = [SYSTEM_PERSONA, MASTER_MERGE_PROMPT, MERGE_AGENT].join("\n\n");
    const selectedBlocksText = resolvedBlocks.join("\n\n");
 
    const userMessage =
      `CRITICAL INSTRUCTION: The BASE_IMAGE_DESCRIPTION below is the SOLE AND ABSOLUTE REFERENCE for what exists in the scene. You must ONLY apply rendering quality, materials, lighting, and atmosphere to elements explicitly described in this base image. Do NOT add, create, or reference any element not present in this description. If a selected block mentions an element not in the base image (e.g., a pool block selected but no pool exists in the base image), suppress geometry-specific instructions from that block and apply only its lighting and atmospheric quality directives generically.\n\n` +
      `BASE_IMAGE_DESCRIPTION:\n${imageDescription.trim()}\n\n` +
      `SELECTED_BLOCKS:\n${selectedBlocksText}\n\n` +
      `OPTIONAL_PEOPLE_ANIMALS (add only if described — do not invent):\n${humanizationText?.trim() || "(none)"}\n\n` +
      `Generate the merged prompt now. The output must repeatedly reinforce fidelity to the existing geometry. Return only the final merged prompt text, no explanations, no preamble.`;
 
    // ── Chamada à API com timeout ─────────────────────────────────────────
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: API_MODEL,
          max_tokens: 3000,
          messages: [
            { role: "system", content: systemContent },
            { role: "user",   content: userMessage },
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
      console.error("API error:", status, errorText);
      throw new Error(`API error: ${status}`);
    }
 
    const data = await response.json();
    const mergedPrompt = data.choices?.[0]?.message?.content?.trim() || "";
 
    if (!mergedPrompt) {
      throw new Error("O modelo retornou uma resposta vazia.");
    }
 
    // ── Prompt final = merge da IA + SUFFIX + NEGATIVE_PROMPT ─────────────
    const finalPrompt = [mergedPrompt, SUFFIX, NEGATIVE_PROMPT]
      .filter(Boolean)
      .join("\n\n");
 
    // ── Resposta ──────────────────────────────────────────────────────────
    const usedKeys = selectedKeys.filter((k) => {
      for (const category of ORDERED_CATEGORIES) {
        if (PROMPT_CATEGORIES[category].includes(k) && (RENDER_PROMPTS[k]?.trim() ?? "") !== "") {
          return true;
        }
      }
      return false;
    });
 
    return new Response(
      JSON.stringify({
        prompt: finalPrompt,
        usedKeys,
        ...(unknownKeys.length > 0 && { ignoredKeys: unknownKeys }),
        ...(emptyAmbienteKeys.length > 0 && { pendingAmbientes: emptyAmbienteKeys }),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
 
  } catch (e) {
    console.error("generate-prompt error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro interno ao gerar prompt",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
