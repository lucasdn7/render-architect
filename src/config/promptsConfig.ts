export const SYSTEM_PERSONA = `You are a senior architect, urbanist, and interior designer with 20 years of experience, specialized in generating photorealistic AI image prompts for architectural renders. You have deep knowledge of 3D rendering, lighting techniques, materials, spatial composition, and photographic principles. You always write prompts in English, highly technical, optimized for Midjourney, DALL-E 3, and Adobe Firefly. Your prompts are precise, vivid, and produce award-winning architectural visualizations.`

export const NEGATIVE_PROMPT = `DO NOT ALTER, MODIFY, OR DEVIATE FROM THE ORIGINAL 3D MODEL GEOMETRY. The architectural form, massing, proportions, window placements, door locations, roof pitches, and all structural elements as defined in the base image are ABSOLUTE AND IMMUTABLE. Do not add, remove, or resize any part of the building. Do not change the architectural style. Do not introduce new architectural features not present in the original design. The AI's role is strictly limited to applying photorealistic textures, lighting, atmospheric effects, and vegetation enhancements to the existing, unchanged geometry.

Vegetation is the sole exception: landscaping elements such as trees, shrubs, ground cover, grass, planters, hedges, and other vegetation blocks may be freely replaced, enhanced, added, or removed to improve realism and visual quality — provided they do not obscure, distort, or conflict with the legibility of the architectural geometry.

Preserve all geometric and proportional integrity of the original design without exception. Deformed, distorted, warped, melted, or unrealistic architectural forms are strictly forbidden. Ensure all lines remain straight, all circles perfectly circular, and all architectural angles are rendered with perfect precision as designed.`;

export const MASTER_MERGE_PROMPT = `As an expert AI prompt meshing system for architectural visualization, your task is to combine selected prompt blocks into a single, coherent, and highly effective rendering prompt. Follow this strict hierarchical order and conflict resolution strategy:

How your AI meshing system should operate:
• It must concatenate the texts of the blocks in hierarchical order (1 -> 2 -> 3 -> 4 -> 5 -> 6).
• In case of direct conflict, the instruction from the higher-level block always prevails (e.g., the lens defined in the "Camera Perspective" block has priority over a lens mention in an "Lighting" block).
• Repeated terms (like "hyper-realistic") should be consolidated or have their weight increased, not interpreted as contradictory.

This structure ensures that every aspect of the rendering is controlled precisely and that the final prompt is robust, technically coherent, and capable of generating photorealistic images of the highest quality, fully respecting the original SketchUp design.`;

export const MERGE_AGENT = `Persona: You are a "Render Master AI", an expert in architectural visualization with deep knowledge in photorealistic rendering, PBR materials, advanced lighting, and photographic composition. Your mission is to interpret and combine the provided prompt blocks to generate a final cohesive and technically optimized prompt for state-of-the-art rendering engines.

Operation Logic:

1. Hierarchical Priority: Always prioritize instructions from higher-level blocks over lower-level ones in case of direct conflict. The order of blocks is: Camera > Lighting > Environment > Global Style.

2. Intelligent Merging: Concatenate the prompts fluidly, ensuring the language is natural and technically precise. Avoid unnecessary repetitions, but reinforce key terms (e.g., PBR, ray-traced) when appropriate.

3. Conflict Resolution:

• Camera: If a style or environment block suggests a lens or angle that contradicts the selected Camera block, the Camera block prevails. Adjust the prompt to reflect the Camera block's intent.

• Lighting: If an environment or style block suggests a lighting condition that contradicts the selected Lighting block, the Lighting block prevails. Adjust the prompt to reflect the Lighting block's intent.

• PBR Materials: Instructions for PBR materials in environment or ambient element blocks should be considered detailed refinements and integrated, as long as they do not contradict the overall PBR quality defined in the Global Style block.

4. Geometric Preservation: The "NEGATIVE PRESERVATION BLOCK" is absolute and must be appended at the end of the generated prompt, without modifications, to ensure the integrity of the original 3D model.

5. Flexibility: Allow selection of up to two "Environment" blocks and merge them harmoniously, prioritizing clarity and visual coherence.

6. Final Output: The result must be a single text prompt, ready to be inserted into an AI image generator, optimized for photorealism and architectural precision.`;
 
export const RENDER_PROMPTS: Record<string, string> = {
 
  // ─────────────────────────────────────────────
  // TIPO DE RENDER
  // ─────────────────────────────────────────────
 
  render_geral: `Transform this 3D print into an ultra-photorealistic image, as if captured by a professional architectural photographer using a high-end DSLR/full-frame camera.
Mandatory rules (do not violate): maintain 100% of the original project without adding, removing or modifying any element. Do not alter materials, textures, colors, furniture, volumetry or layout. Do not replace cladding or reinterpret finishes. Do not add decorative objects, plants, people, extra lighting or artistic effects.
Visual objective: 100% photographic appearance, completely eliminating any render or illustration aspect. Natural and realistic lighting coherent with the original environment. Soft and physically correct shadows. Textures exactly matching the model, only with camera realism (sharpness, microcontrast and depth). Perspective and framing identical to the original print.
Technical quality: 4K resolution, high level of detail, slight realistic depth of field where applicable, neutral white balance and correct exposure.
Final expected result: an image indistinguishable from a real photograph, maintaining absolute fidelity to the original project, without any creative interference. IMPORTANT: Do not alter any texture or format of the original base image.`,

  render_externo: `Transform the SketchUp model into a hyper-photorealistic architectural rendering of a residential or commercial facade, 
  emulating professional architectural photography. STRICTLY preserve 100% of the original volumetry, proportions, and design, ensuring no 
  alterations to architectural forms, openings, or compositional elements. Adjust exposure, white balance, and contrast to mimic a full-frame 
  DSLR camera with a 24mm tilt-shift lens, ensuring perfectly corrected verticals.`,

  render_interno: `Transform the SketchUp model into a hyper-photorealistic interior architectural rendering, emulating professional interior 
  design photography. STRICTLY preserve 100% of the spatial layout, ceiling heights, openings, furniture placement, and all architectural 
  proportions without any modification. Adjust exposure, white balance, and depth of field to simulate a DSLR camera with a 24mm wide-angle 
  lens at eye level (1.2m height), ensuring natural perspective.`,
 
  render_aereo: `Transform the SketchUp model into a hyper-photorealistic aerial rendering of the full site, emulating professional cinematic 
  drone photography. STRICTLY preserve 100% of the site layout, roof geometry, landscaping footprint, and all architectural volumes, 
  ensuring no alterations. Adjust exposure, white balance, and color grading to mimic a DJI Mavic 3 Pro camera at 80 meters altitude, 
  45-degree oblique angle, with precise perspective foreshortening and corrected lens distortion.`,
 
  render_detalhe: `Transform the SketchUp model into a hyper-photorealistic architectural detail rendering, emulating professional macro 
  architectural photography. STRICTLY preserve 100% of the original geometry of the detail being shown (e.g., material junction, window 
  reveal, structural connection, facade joint, canopy edge), ensuring no modifications to form or proportion. Adjust exposure and depth of 
  field to mimic a DSLR camera with an 85mm macro lens at F2.0, with a razor-sharp focus plane precisely on the primary detail.`,

  render_corte: `Transform the SketchUp model into a hyper-photorealistic architectural section rendering, emulating a professional 
  cut-through visualization. STRICTLY preserve 100% of the section geometry, floor-to-floor heights, slab thicknesses, wall depths, stair 
  configurations, and spatial relationships between internal environments as drawn. The cut plane MUST remain exactly as defined in the 
  original, with no reinterpretation or closing of any opening created by the section cut. Adjust camera to simulate a DSLR positioned 
  perfectly perpendicular to the cut plane, with a true orthographic or near-orthographic perspective, ensuring the full section height is 
  in frame and free of perspective distortion.`,
 
  planta_humanizada: `Transform the SketchUp or CAD floor plan model into a hyper-photorealistic humanized plan rendering, emulating a 
  professional top-down architectural visualization. STRICTLY preserve 100% of the original floor plan geometry (wall positions, room 
  dimensions, door and window openings, circulation paths, spatial layout), ensuring no modifications whatsoever. Adjust rendering to 
  simulate a perfectly vertical overhead camera, with zero perspective distortion (true orthographic projection), and even, diffuse global 
  illumination from above, mimicking a studio lighting setup.`,

  // ─────────────────────────────────────────────
  // PERÍODO DO DIA / ILUMINAÇÃO
  // ─────────────────────────────────────────────

  diurno: `Apply crisp, bright midday natural daylight with the sun at a high elevation (approximately 65-75 degrees above the horizon). 
  Color temperature precisely at 5600K (daylight white balance). Simulate advanced global illumination and ray tracing to produce sharp, 
  well-defined directional shadows. The sky should be rendered as a vibrant, clear deep blue with subtle atmospheric scattering and one or 
  two photorealistic, scattered cumulus clouds. Ensure full ambient bounce light from the ground plane and surrounding PBR surfaces, 
  accurately filling shadow areas with soft, physically accurate secondary illumination and subtle color bleeding. All facade materials 
  should receive direct solar radiation with precise PBR specular and diffuse response. Ensure no overexposure on brightly lit surfaces 
  while retaining full detail and dynamic range in shadow zones.`,

  entardecer: `Apply exquisite golden hour natural lighting with the sun positioned precisely at 8-10 degrees above the horizon, with a warm 
  color temperature gradually dropping from 3500K to 2500K. All west and south-facing PBR surfaces should be bathed in rich, warm amber and 
  orange light, exhibiting realistic subsurface scattering for foliage and translucent materials. East-facing surfaces should be in cool blue 
  shadow, softly illuminated by the ambient sky fill. Cast dramatically long, raking shadows stretching across the ground plane, intensely 
  emphasizing surface texture, relief, and micro-details. The sky should be rendered as a breathtaking gradient from deep burnt orange at the 
  horizon, transitioning through vibrant magenta and rose pink, to a serene cobalt blue at the zenith, with subtle atmospheric haze and 
  volumetric light rays piercing through vegetation or architectural openings. Specular highlights should be intensely pronounced on glazed 
  surfaces, polished metals, and water features, showcasing accurate Fresnel reflections. Ensure no clipping of highlights or crushing of 
  blacks.`,

  noturno: `Apply immersive full nighttime lighting conditions with a deep indigo to near-black sky, featuring a subtle, realistic star 
  texture and a soft, cool moonlight contribution as secondary fill. All exterior artificial light sources must be fully active and rendered 
  with physically accurate IES light profiles: facade wash lighting, precise soffit downlights, dramatic landscape uplights on trees and 
  plants, clearly defined pathway lights at grade, and luminous pool or water feature underwater lighting where present. Interior spaces 
  should glow warmly through glazed surfaces, casting soft, inviting interior light onto adjacent exterior floor planes, with visible light 
  spill and subtle color interaction. Render all light sources with natural bloom, lens flare, and realistic falloff, ensuring no clipping 
  or overexposure on bulb sources, and maintaining detail within the light source itself. Deep shadow zones should exhibit only soft, ambient
  spill from nearby fixtures, with rich, dark tones but retaining subtle detail. Color temperature of artificial sources should be precisely 
  between 2700K and 3000K (warm white). Minimize noise, and achieve a natural, balanced light distribution across the scene.`,

  nublado: `Apply soft, diffused overcast sky lighting conditions with a dense, full cloud cover acting as an expansive natural diffusion 
  panel. Color temperature precisely at 6500K (cool daylight). Simulate advanced global illumination to ensure zero hard shadows anywhere in 
  the scene; instead, all PBR surfaces should receive soft, directionless, even illumination simultaneously, revealing subtle form and 
  texture. The sky should be rendered as a uniform, silver-white to light gray overcast layer with nuanced tonal variation and volumetric 
  depth between cloud masses. All material colors should be rendered at their most accurate and saturated, free from the interference of 
  direct sunlight or harsh shadow contrast. A subtle cool blue-gray tone should permeate the ambient light, enhancing realism. The ground 
  plane should receive soft, physically accurate bounce light from the expansive sky dome above. Aim for a perfectly balanced histogram, no 
  blown highlights, and full, rich shadow detail retained. This lighting condition is ideal for showcasing material legibility, architectural 
  clarity, and nuanced surface textures.`,

  chuva: `Apply a dramatic, active rainstorm atmosphere with a dark, brooding mid-gray stratocumulus overcast sky. Render hyper-realistic 
  fine rain streaks as diagonal motion blur across the full frame, with density consistent with a moderate to heavy rainfall. All horizontal 
  PBR surfaces must be covered in a thin, highly reflective water film, producing mirror-like specular reflections of the sky, facade, and 
  all light sources. Photorealistic puddles should accumulate in low points and joints, featuring subtle concentric ripple patterns. 
  Facade glazing should be realistically streaked with water rivulets running vertically, exhibiting accurate refraction and distortion. 
  The ambient light should be flat, desaturated, and cool (precisely 6800K), slightly underexposed to powerfully reinforce the storm mood 
  and sense of drama. All artificial light sources, where present, must be rendered with intensely intensified bloom and volumetric light 
  shafts from moisture in the air, creating a captivating glow. Incorporate a noticeable atmospheric haze that subtly reduces the contrast 
  of distant elements and enhances the sense of depth.`,

  amanhecer: `Apply ethereal pre-sunrise dawn lighting with the sun not yet visible above the horizon. The sky should be rendered as a 
  magnificent, layered gradient: deep charcoal at the zenith, gracefully transitioning through soft rose pink, delicate peach, and pale 
  lavender, descending toward the horizon where a warm, backlit, and intensely luminous glow is present. The overall scene should be softly 
  illuminated by a cool (precisely 4200K) indirect sky dome light, ensuring no direct solar shadows are cast. Introduce a subtle, low 
  atmospheric ground haze at 0.5 to 1.0 meter height, partially obscuring the base of trees and the ground plane, enhancing depth and
  mystery. Photorealistic dew should be visibly clinging to vegetation, horizontal PBR surfaces, and glazing, exhibiting accurate refractive 
  qualities. Long, horizontal cloud layers at the horizon should catch the earliest, most vibrant light in shimmering gold and amber tones. 
  All facade surfaces should receive a cool, soft, directional fill light emanating from the intensely bright horizon zone. With slightly 
  lifted shadows, gentle highlight rolloff, and a profound sense of atmospheric depth.`,

  // ─────────────────────────────────────────────
  // ELEMENTOS DO AMBIENTE
  // ─────────────────────────────────────────────

  piscina: `The masonry pool should feature physically based rendering (PBR) tile or mosaic cladding with subtle grout lines, 
  micro-imperfections, and accurate material reflectivity. The water must be crystal clear, exhibiting physically accurate transparency, 
  refraction, and subsurface scattering for realistic depth, with gentle, natural surface undulation and subtle surface tension effects. 
  Simulate dynamic, precise caustics dancing on the pool floor and walls, varying realistically with sun angle and water movement. 
  The external deck should be rendered with PBR natural wood or high-quality porcelain tile, showcasing realistic grain, texture, subtle 
  wear, and accurate reflections. Include realistic PBR sun loungers with natural fabric textures, a sophisticated umbrella, and high-end 
  external furniture, all casting soft, accurate shadows.`,

  jardim: `All vegetation should be rendered with physically based rendering (PBR) foliage, showcasing natural, vibrant colors, physically 
  correct leaf textures with subtle imperfections (e.g., veins, slight wilting, dew drops), and accurate natural scale. Simulate advanced 
  subsurface scattering for leaves and petals, allowing light to pass through and create realistic translucency. Ensure natural lighting 
  coherent with the environment, producing realistic, soft-edged shadows cast by vegetation, with nuanced depth and layering in the planting 
  composition. Emphasize an extremely high level of botanical detail, photorealistic organic materials, and dynamic interaction with light 
  and wind (subtle movement).`,
 
  area_gourmet: `Integrate ambient string lighting with realistic light falloff and subtle bloom for a warm, inviting atmosphere. 
  All materials should be physically based rendering (PBR): natural wood for the pergola and furniture with authentic grain and subtle 
  weathering, natural stone or high-quality porcelain countertops with accurate reflectivity and micro-imperfections, and brushed stainless 
  steel appliances with anisotropic reflections. Ensure warm and balanced global illumination, coherent with a high-end gourmet environment,
  with soft, diffused shadows.`,
 
  garagem: `The meticulously paved approach featuring physically based rendering (PBR) floor texture (e.g., concrete, pavers, asphalt) with 
  subtle wear, tire marks, and accurate reflectivity. The architectural car portal detail should exhibit precise PBR material finishes 
  (e.g., brushed metal, textured concrete, natural wood with grain). Include hyper-realistic vehicles where visible, rendered with accurate 
  paint reflections, subtle dust, and realistic tire textures. Ensure natural global illumination coherent with the facade lighting, casting 
  sharp, defined shadows from architectural elements and vehicles.`,
 
  deck: `Render a professional, hyper-realistic natural hardwood deck, showcasing a rich, authentic timber grain texture, realistic 
  weathering (e.g., subtle fading, water stains, micro-scratches), and natural tonal variation of real wood, all rendered with physically 
  based rendering (PBR) properties. Outdoor lounge furniture should be seamlessly integrated into the deck composition, featuring PBR 
  fabrics and materials with realistic wear. Emphasize a seamless indoor-outdoor transition visible in the framing, with accurate visual 
  continuity. Ensure warm, natural global illumination that enhances wood tones, producing physically correct reflections on smooth 
  surfaces and subtle subsurface scattering for any translucent elements. Apply a precise depth of field, with the sharp focus plane 
  specifically on the deck material detail, creating a beautiful bokeh effect for the background.`,
 
  iluminacao_cenica: `Render a dramatic, hyper-realistic nighttime scene with sophisticated architectural uplighting on the facade, utilizing
  precision spotlights with accurate IES profiles to dynamically highlight architectural volumes and textures. Integrate subtle, warm garden 
  path lighting with soft glows and realistic light falloff. Implement elegant LED strip accents on architectural details, creating a refined
  light sculpture effect through deliberate, high-contrast interplay of light and shadow. All artificial light sources should emit a 
  consistent warm white light (precisely 3000K), with physically accurate bloom, lens flare, and volumetric light shafts where appropriate. 
  Ensure global illumination is balanced, preventing blown highlights while maintaining rich detail in deep shadow zones, contributing to a 
  sophisticated nighttime atmosphere.`,
 
  nevoa: `Render a captivating scene with morning atmospheric fog, featuring ethereal mist layers gracefully enveloping lower vegetation and 
  the ground plane. Introduce a soft, volumetric depth haze that naturally reduces background visibility, creating a dreamlike and serene 
  quality. The lighting should be diffused, soft, and coherent with a foggy morning atmosphere, utilizing global illumination to ensure even 
  light distribution. Employ a muted color palette dominated by cool blue-grey tones, with subtly desaturated hues. Ensure reduced contrast 
  and atmospheric visibility depth, creating natural, discernible layers of depth and perspective.`,

  espelho_dagua: `Render a professional, hyper-realistic still water mirror pool, functioning as a zen reflecting pool perfectly integrated 
  into the architectural composition. This horizontal water feature should possess a crystal-still surface, exhibiting physically accurate 
  mirror-like reflections of the sky, surrounding architecture, and any light sources. Simulate subtle, dynamic caustic light patterns on the
  pool floor, varying with light conditions. The water material should be physically based rendering (PBR), showcasing realistic transparency,
  refraction, and a visible, delicate surface tension. Ensure global illumination accurately captures the interplay of light and reflections.`,

  // ─────────────────────────────────────────────
  // ENTORNO
  // ─────────────────────────────────────────────

  entorno_residencial: `Render the surrounding residential context visible in the scene — neighboring houses, low-rise buildings, front yards,
  garden walls, fences, parked vehicles on street, sidewalks, utility poles, and residential street infrastructure — all at 
  **hyper-photorealistic fidelity** consistent with the scale and character of the primary building. Surrounding structures rendered with 
  **accurate PBR material variation** (e.g., weathered brick, textured stucco, aged wood, reflective glass), **detailed window patterns**, 
  **diverse roofline treatments**, and **natural weathering appropriate to an established residential neighborhood**. Street-level human 
  activity where present — pedestrians, cyclists, parked cars — rendered with **realistic scale, natural positioning, and subtle subsurface 
  scattering for organic elements**. Ambient neighborhood atmosphere conveyed through **background depth with atmospheric perspective**,
  mature street trees lining sidewalks, and layered building planes receding into distance with **correct aerial perspective and volumetric 
  haze**. All surrounding context subordinate in visual hierarchy to the primary architectural subject, rendered with **slightly reduced 
  sharpness, contrast, and depth-of-field falloff toward the background** to reinforce depth and focus. **Global Illumination (GI)** and 
  **Physically Based Lighting (PBL)** should accurately simulate light interaction with all surfaces, creating realistic shadows, reflections, 
  and refractions.`,

  entorno_comercial: `Render the surrounding commercial urban context visible in the scene — mid to high-rise office buildings, retail 
  facades, signage, commercial streetscape, wide paving, vehicle traffic, bus lanes, pedestrian flow, street furniture, and urban 
  infrastructure — all at **hyper-photorealistic fidelity** consistent with the density and character of a commercial district. Surrounding 
  buildings rendered with **accurate PBR material variation** (e.g., curtain wall glazing, polished concrete, metal panels, illuminated 
  signage), **detailed cladding patterns**, **mechanical penthouses**, and **dynamic illuminated signage** where appropriate to lighting 
  conditions. Street level populated with pedestrians in motion, commercial vehicles, taxis, and parked cars rendered at **realistic scale, 
  natural positioning, and subtle subsurface scattering for organic elements**. Urban background rendered with **correct atmospheric haze 
  and depth falloff** — foreground context sharp and detailed, mid-ground buildings with reduced contrast, distant skyline fading into 
  **atmospheric perspective and volumetric haze**. All surrounding commercial context rendered as a credible, living urban environment 
  while remaining visually subordinate to the primary architectural subject through **controlled depth-of-field falloff and atmospheric 
  perspective**. **Global Illumination (GI)** and **Physically Based Lighting (PBL)** should accurately simulate light interaction with all 
  surfaces, creating realistic shadows, reflections, and refractions.`,

  entorno_vegetacao: `Render the surrounding natural landscape context visible in the scene — mature trees, forest edge, dense vegetation 
  layers, ground cover, wild grasses, shrubs, and organic terrain — all at **hyper-photorealistic fidelity** with **species-appropriate 
  silhouette, accurate PBR leaf translucency, intricate branching structure, and natural color variation**. Vegetation rendered with 
  **accurate response to the active lighting conditions** — direct sunlight producing **realistic leaf backlight, dappled shadow patterns on 
  ground, and volumetric light shafts**, overcast conditions producing even muted green tones, golden hour producing warm amber rim light on
  canopy edges. **No two trees identical** — natural variation in height, crown shape, and seasonal color present throughout. Ground plane 
  beneath vegetation rendered with **detailed leaf litter, exposed roots, moss, and soil texture appropriate to a naturalistic setting**. 
  Background vegetation fading into **atmospheric depth with correct color desaturation and contrast reduction toward the horizon, 
  incorporating volumetric fog and haze**. All natural context rendered as a cohesive living landscape, reinforcing the integration of 
  architecture within its natural environment. **Global Illumination (GI)** and **Physically Based Lighting (PBL)** should accurately 
  simulate light interaction with all surfaces, creating realistic shadows, reflections, and refractions.`,

  entorno_predios: `Render the surrounding mid and high-rise building context visible in the scene — apartment towers, mixed-use residential 
  blocks, commercial ground floors, rooftop water tanks, mechanical equipment penthouses, and dense urban street infrastructure — all at 
  **hyper-photorealistic fidelity** consistent with the scale and vertical density of a consolidated urban district. Surrounding buildings
  rendered with **accurate PBR facade material variation** (e.g., curtain wall glazing with realistic reflections, precast concrete panels 
  with subtle imperfections, ceramic tile cladding with grout lines, painted render with weathering effects, exposed concrete with formwork
  textures) — each block with **individual window pattern, balcony rhythm, and roofline treatment**. Ground floor level rendered with 
  **detailed commercial activity, retail awnings, building entrances, intercom panels, and realistic pedestrian flow at street scale**.
  Urban street infrastructure present — **wide sidewalks with PBR textures, traffic signals with emissive materials, bus stops, parked 
  vehicles with realistic reflections, delivery trucks, and lane markings with subtle wear**. Rooftop silhouettes of surrounding towers 
  layered against sky in **correct perspectival recession, distant buildings fading into atmospheric haze with progressive contrast and 
  detail reduction toward the horizon, incorporating volumetric fog and haze**. All surrounding urban context rendered as a dense, 
  inhabited, and credible cityscape while remaining visually subordinate to the primary architectural subject through **controlled 
  depth-of-field falloff and atmospheric perspective**. **Global Illumination (GI)** and **Physically Based Lighting (PBL)** should 
  accurately simulate light interaction with all surfaces, creating realistic shadows, reflections, and refractions.`,

  entorno_casas: `Render the surrounding residential house context visible in the scene — single-family homes of varied architectural styles, 
  low perimeter walls, front gardens, driveways, garage doors, mailboxes, sidewalks, and residential street details — all at 
  **hyper-photorealistic fidelity** consistent with the scale and material character of a consolidated residential neighborhood. 
  Each neighboring house rendered with **individual PBR material variation** (e.g., painted render with subtle aging, exposed brick 
  with detailed mortar, timber cladding with realistic grain, ceramic tile roofing with moss and wear, metal sheet roofing with reflections) 
  — no two houses identical in finish or architectural detailing. Front yards with **mature planted gardens, lush lawn areas, ornamental 
  hedges, and specimen trees providing natural screening between properties, all with accurate PBR textures and subsurface scattering**. 
  Parked vehicles in driveways and along street curb rendered at **correct residential scale with realistic reflections and subtle 
  imperfections**. Street surface with **detailed asphalt texture, painted lane markings with wear, speed humps, and kerb detail**. 
  Overhead utility lines and residential-scale street lighting where consistent with neighborhood character, with **realistic light falloff 
  and volumetric effects**. All surrounding houses rendered with **natural weathering, slight facade aging, and the accumulated material 
  patina of an inhabited neighborhood**, while remaining visually subordinate to the primary architectural subject through **controlled 
  background depth and atmospheric falloff**. **Global Illumination (GI)** and **Physically Based Lighting (PBL)** should accurately 
  simulate light interaction with all surfaces, creating realistic shadows, reflections, and refractions.`,

  // ─────────────────────────────────────────────
  // QUALIDADE / ESTILO DO RENDER
  // ─────────────────────────────────────────────

  fotorrealista: `Final render quality: **hyper-photorealistic**, 8K ultra-high resolution, **physically-based rendering (PBR) pipeline** 
  with **bidirectional scattering distribution function (BSDF)** for all materials, **unbiased ray-traced global illumination (GI)** and 
  **path-traced reflections/refractions**, accurate Fresnel response on glass and polished surfaces, **micro-surface roughness variation** 
  on matte materials for realistic light diffusion, **advanced sub-surface scattering (SSS)** on organic elements (e.g., vegetation, fabrics)
  for lifelike translucency. **Camera simulation**: emulating a **Canon EOS R5** with a **calibrated 35mm prime lens**, F4 aperture, ISO 200,
  **scientifically accurate exposure metering** and **dynamic range mapping**. **Post-processing**: subtle film grain at 4%, slight vignette,
  **chromatic aberration consistent with real-world lens optics**, and **bloom/glare effects** for light sources. Output indistinguishable 
  from on-site professional architectural photography, suitable for high-end print media.`,

  classico: `Final render quality: **impeccable academic architectural presentation standard**, neutral color grading with a subtle warm bias,
  **soft, diffused shadows** with no extreme contrast or mood manipulation, all materials rendered with **technical accuracy and full PBR 
  color fidelity**, balanced symmetric or harmonious composition, sky neutral and non-distracting (e.g., clear blue or evenly overcast), 
  vegetation as calm, well-defined green masses with **accurate PBR leaf textures**. **Global Illumination (GI)** and **Physically Based 
  Lighting (PBL)** should ensure even illumination and accurate material response. Output equivalent to **AIA portfolio submission** or 
  **RIBA award documentation quality**, emphasizing clarity, precision, and timeless aesthetic.`,

  atmosferico: `Final render quality: **cinematic editorial grade**, strong foreground-to-background depth layering, **lifted blacks and 
  crushed highlights** for dramatic tonal range, rich color grading with intentional mood bias, deep shadow zones with selective ambient 
  fill, composition with strong diagonal movement and deliberate negative space. **Advanced volumetric lighting** and **atmospheric effects** 
  (e.g., fog, haze, dust motes) to enhance mood. **Global Illumination (GI)** and **Physically Based Lighting (PBL)** should be meticulously 
  controlled to create specific emotional responses. Output equivalent to **Dezeen, ArchDaily, or Wallpaper* architectural editorial 
  photography standard**, referencing the evocative work of Iwan Baan or Hufton+Crow, suitable for high-impact visual storytelling.`,

 
  minimalista: `Final render quality: **stripped-back minimalist presentation**, architecture isolated against a neutral pale or white 
  overcast sky (with **subtle volumetric cloud detail**), ground plane in uniform light tone with **minimal PBR texture variation**, 
  all contextual distraction reduced to near zero, color palette limited to the architecture\'s own material range with no supplementary 
  color. Composition centered with generous negative space, emphasizing clean lines and geometric forms. Vegetation if present reduced to a 
  single restrained specimen with **accurate PBR leaf textures and subtle subsurface scattering**. **Global Illumination (GI)** and 
  **Physically Based Lighting (PBL)** should provide even, soft illumination, highlighting architectural purity. Output referencing the 
  stillness and precision of Tadao Ando documentation and John Pawson project photography, suitable for showcasing architectural form and 
  light.`,
 
  // ─────────────────────────────────────────────
  // CÂMERA / PERSPECTIVA
  // ─────────────────────────────────────────────
 
  eye_level: `Camera positioned at standard human eye level, **precisely 1.6 meters above the ground plane**, with a horizontal sight line 
  perfectly parallel to the floor, replicating a natural standing-person perspective. **Focal length calibrated to 35mm to 50mm (full-frame 
  equivalent)**, accurately mirroring the natural human field of vision with **zero vertical distortion** (achieved via tilt-shift simulation 
  or post-correction). The ground plane is visibly present in the lower third of the frame, the sky or ceiling occupies the upper third, and 
  the architectural subject fills the entire vertical middle zone. This setup provides the most natural and immediately relatable viewing 
  angle for residential and commercial architecture, simulating the precise perception of a person standing on site. **Physically Based 
  Camera (PBC)** model ensures accurate depth of field, motion blur (if applicable), and lens characteristics.`,
 
  worm_eye: `Camera positioned extremely low, **between 10 to 20 centimeters above the ground plane**, with the lens tilted sharply upward 
  toward the building. This creates **strong converging vertical lines** running from the base of the building upward, dramatically 
  exaggerating building height and structural mass. The ground plane occupies the foreground as a dominant, richly textured surface in 
  **sharp PBR detail**. The sky fills a large proportion of the upper frame, emphasizing scale. Overhangs, soffits, the underside of 
  balconies, cantilevered volumes, and structural columns become primary compositional elements. **Focal length calibrated to 20mm to 24mm 
  (full-frame equivalent) wide-angle lens** to maximize vertical drama and spatial distortion. This angle powerfully communicates a sense of 
  power, monumentality, and structural ambition. **Physically Based Camera (PBC)** model ensures accurate depth of field, motion blur (if 
  applicable), and lens characteristics`,
 
  bird_eye: `Camera positioned directly overhead or at a high oblique angle **between 60 and 90 degrees downward**, simulating an aerial or 
  elevated observation point. The full site footprint is visible — roof planes, terraces, landscaping, pool, driveway, surrounding context,
  and street geometry are all readable simultaneously. Roof materials, parapet details, rooftop equipment, and plan organization are 
  **legible with PBR accuracy** from above. Ground-level context, including neighboring structures, trees, and hardscape, is visible for 
  scale and orientation. **Focal length calibrated to 24mm to 35mm (full-frame equivalent)**. This angle effectively communicates site 
  strategy, massing logic, roof design, and the relationship of the building to its urban or natural surroundings. **Physically Based Camera
  (PBC)** model ensures accurate depth of field, motion blur (if applicable), and lens characteristics.`,
 
  dutch_angle: `Camera rotated on its longitudinal axis **between 15 and 35 degrees from horizontal**, producing a deliberate diagonal 
  tilt across the entire frame. The horizon line runs diagonally rather than horizontally, and all vertical architectural elements — 
  columns, walls, window frames — are rendered at an angle relative to the frame edges. This creates **visual tension, dynamic energy, 
  and cinematic unease**. Compositional diagonals reinforce the tilt, with strong leading lines running corner to corner. **Focal length 
  calibrated to 24mm to 35mm (full-frame equivalent)**. Best applied to editorial, atmospheric, or concept renders where mood and dramatic 
  impact take priority over technical legibility. Avoid for presentation drawings requiring architectural accuracy. **Physically Based 
  Camera (PBC)** model ensures accurate depth of field, motion blur (if applicable), and lens characteristics.`,
 
  wide_angle: `Camera fitted with an **ultra-wide angle lens equivalent to 14mm to 20mm focal length (full-frame equivalent)**, capturing an 
  expanded horizontal and vertical field of view in a single frame. **Precisely controlled barrel distortion** or **deliberately corrected 
  rectilinear perspective** depending on desired artistic effect. Foreground elements appear larger and more prominent relative to 
  background, **exaggerating spatial depth and distance** between near and far planes. Tight interior spaces appear expansive and generous. 
  Exterior shots capture full building width plus substantial surrounding context within a single composition. Vertical lines at frame edges
  may converge or diverge — **correct with tilt-shift simulation for formal presentation**, or retain for dynamic editorial effect. This 
  angle is ideal for communicating spatial generosity, site context, and architectural scale in a single image. **Physically Based Camera 
  (PBC)** model ensures accurate depth of field, motion blur (if applicable), and lens characteristics.`,
 
  // ─────────────────────────────────────────────
  // SUFIXO TÉCNICO UNIVERSAL
  // ─────────────────────────────────────────────
 
  suffix: `Rendered with full physically-based rendering pipeline, ray-traced global illumination, HDRI sky lighting, accurate Fresnel reflectivity on all surfaces, micro-surface roughness variation, contact shadows and ambient occlusion at every junction. Camera simulation: full-frame sensor, 35mm prime lens, F5.6 aperture, ISO 100, 1/250s, correct exposure metering with no blown highlights and full shadow detail retained. Color grading: neutral LUT with slight warm bias, contrast curve lifted at midtones, no artificial saturation boost. Output sharpness equivalent to medium-format architectural photography. Subtle film grain at 3%, real lens vignette, no HDR halo artifacts. The final image must be indistinguishable from a photograph taken on location by a professional architectural photographer. --ar 16:9 --q 2 --v 6.1 --style raw`
 
}
 
// ─────────────────────────────────────────────
// MAPEAMENTO: combinações render + iluminação
// Usado internamente para selecionar o prompt correto
// conforme tipo de render + período selecionados
// ─────────────────────────────────────────────
 
export const PROMPT_COMBINATIONS: Record<string, string> = {
  "render_externo+diurno":      RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.diurno,
  "render_externo+entardecer":  RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.entardecer,
  "render_externo+noturno":     RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.noturno,
  "render_externo+nublado":     RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.nublado,
  "render_externo+chuva":       RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.chuva,
  "render_externo+amanhecer":   RENDER_PROMPTS.render_externo + " " + RENDER_PROMPTS.amanhecer,
  "render_interno+diurno":      RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.diurno,
  "render_interno+entardecer":  RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.entardecer,
  "render_interno+noturno":     RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.noturno,
  "render_interno+nublado":     RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.nublado,
  "render_interno+chuva":       RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.chuva,
  "render_interno+amanhecer":   RENDER_PROMPTS.render_interno + " " + RENDER_PROMPTS.amanhecer,
}
 
// ─────────────────────────────────────────────
// HUMANIZAÇÃO
// ─────────────────────────────────────────────
 
export const HUMANIZATION_PROMPT = (pessoas: string, animais: string) => {
  const parts: string[] = ["Add lifestyle humanization to the architectural scene:"];
  if (pessoas) {
    parts.push("Human presence: " + pessoas + ". People must look completely natural, candid lifestyle photography style, well-integrated into the architectural setting, not posed or artificial, photorealistic human figures with realistic clothing, skin tones and natural body language, appropriate scale to architecture, no plastic or synthetic appearance.");
  }
  if (animais) {
    parts.push("Animal presence: " + animais + ". Animals in natural relaxed behavior, photorealistic fur/skin textures, harmoniously integrated into the landscape, correct scale to environment, natural posture and expression.");
  }
  parts.push("All humanization elements must be indistinguishable from a real photograph. Do not alter the original architecture, layout or materials.");
  return parts.join("\n");
}
