export const SYSTEM_PERSONA = `You are a senior architect, urbanist, and interior designer with 20 years of experience, specialized in generating photorealistic AI image prompts for architectural renders. You have deep knowledge of 3D rendering, lighting techniques, materials, spatial composition, and photographic principles. You always write prompts in English, highly technical, optimized for Midjourney, DALL-E 3, and Adobe Firefly. Your prompts are precise, vivid, and produce award-winning architectural visualizations.`

export const RENDER_PROMPTS: Record<string, string> = {
  render_externo: "Transforme o print de SketchUp da fachada anexado em uma
imagem fotográfica extremamente realista, mantendo 100% da
geometria, proporções e design original, sem alterar volumes,
aberturas ou elementos arquitetônicos.
Aplique materiais e revestimentos realistas, com texturas físicas
corretas, reflexos naturais, imperfeições sutis e escala real.
Iluminação diurna realista, com céu azul, sol natural, sombras
suaves e bem definidas de acordo com a posição solar.
Adicione contexto realista no entorno, com paisagem urbana
discreta, casas ao fundo levemente desfocadas, vegetação
natural e horizonte coerente, sem roubar o foco da fachada
principal.
Estilo de fotografia arquitetônica profissional, lente realista,
exposição equilibrada, cores naturais, alto nível de detalhe,
aspecto de foto real, sem aparência de render ou ilustração.
Não modificar o projeto original: não adicionar, remover ou
alterar elementos da fachada.
IMPORTANTE Não altere nenhuma textura e nenhum formato da
imagem base original",
  render_interno: "Converta este print de ambiente interno (SketchUp) em uma fotografia profissional de interior ultra-realista em 4K,
como se tivesse sido capturada por um fotógrafo de arquitetura com câmera DSLR/full-frame de alto padrão.
Requisitos obrigatórios:
• Aparência 100% fotográfica, sem aspecto de render ou ilustração
• Iluminação interna extremamente clara e equilibrada, com abundante luz natural entrando pelas aberturas,
ambiente luminoso, sofisticado e arejado
• Exposição perfeita, sem áreas estouradas ou sombras excessivas
• Nitidez máxima e foco preciso, qualidade de fotografia 4K profissional
• Profundidade de campo realista, com leve desfoque natural apenas onde faria sentido em uma foto real
Fidelidade absoluta ao projeto original:
• NÃO alterar o projeto arquitetônico em hipótese alguma
• Manter exatamente o layout, proporções, ângulos, volumetria, mobiliário e composição
• Não adicionar, remover ou modificar nenhum elemento
• Preservar rigorosamente a perspectiva da imagem original
Materiais e texturas:
• Reproduzir com precisão fotográfica todas as texturas do projeto (madeira, concreto, vidro, metais, tecidos,
pedras, plantas e revestimentos)
• Materiais com reflexos, imperfeições sutis e microdetalhes reais, sem exageros
Tratamento fotográfico profissional:
• Cores naturais e realistas
• Contraste suave e elegante
• White balance correto
• Estilo de fotografia de interiores de alto padrão para revistas e portfólio profissional
Objetivo final:
Transformar apenas a aparência visual do render em foto real, mantendo o design 100% idêntico ao arquivo
original.
IMPORTANTE Não altere nenhuma textura e nenhum formato da imagem base original",
  render_aereo: "aerial drone perspective, bird's eye view, top-down architectural overview, urban context visible",
  render_detalhe: "architectural detail close-up, material texture macro, construction detail, design element focus",

  diurno: "Transforme o print de SketchUp da fachada anexado em uma
imagem fotográfica extremamente realista, mantendo 100% da
geometria, proporções e design original, sem alterar volumes,
aberturas ou elementos arquitetônicos.
Aplique materiais e revestimentos realistas, com texturas físicas
corretas, reflexos naturais, imperfeições sutis e escala real.
Iluminação diurna realista, com céu azul, sol natural, sombras
suaves e bem definidas de acordo com a posição solar.
Adicione contexto realista no entorno, com paisagem urbana
discreta, casas ao fundo levemente desfocadas, vegetação
natural e horizonte coerente, sem roubar o foco da fachada
principal.
Estilo de fotografia arquitetônica profissional, lente realista,
exposição equilibrada, cores naturais, alto nível de detalhe,
aspecto de foto real, sem aparência de render ou ilustração.
Não modificar o projeto original: não adicionar, remover ou
alterar elementos da fachada.
IMPORTANTE Não altere nenhuma textura e nenhum formato da
imagem base original",
  entardecer: "golden hour lighting, warm orange amber tones, long dramatic shadows, sun low on horizon, cinematic atmosphere, sky gradient pink to deep blue",
  noturno: "Transforme o print do SketchUp em uma imagem fotorealista de
alta qualidade, como se fosse uma fotografia profissional de
arquitetura.
Preserve 100% da volumetria, proporções, enquadramento e
design original do projeto, sem alterar formas, aberturas ou
elementos arquitetônicos.
Aplique materiais e revestimentos realistas, com texturas
naturais, detalhes precisos, variação sutil de tons, relevo e
reflexos compatíveis com materiais reais.
Cenário de início da noite (blue hour), com céu azul profundo e
suave, iluminação ambiente realista e atmosfera sofisticada.
Adicione iluminação artificial branco quente (3000K) na fachada,
áreas externas e vegetações, criando contraste equilibrado
entre luz e sombra, com glow sutil e realista.
Vegetações com aparência natural, iluminadas de forma cênica,
sem exageros.
Qualidade ultra realista, iluminação global correta, sombras
suaves, reflexos fisicamente plausíveis, profundidade de campo
leve, estilo fotografia DSLR, render arquitetônico premium.
IMPORTANTE Não altere nenhuma textura e nenhum formato da
imagem base original",
  nublado: "Transforme o print do SketchUp em uma imagem fotorealista de
fachada residencial, com aparência de fotografia profissional.
Preserve 100% da volumetria, proporções e design original do
projeto, sem alterar formas arquitetônicas.
Aplique materiais e revestimentos realistas, com texturas em alta
resolução, reflexos naturais, imperfeições sutis e variações de
cor realistas.
Iluminação natural difusa de dia nublado, céu cinza claro, sem
sol direto e sem sombras duras.
Ajuste correto de exposição, balanço de branco e contraste,
simulando câmera DSLR.
Inclua detalhes realistas como leves marcas de uso nos
materiais, profundidade de campo sutil e nitidez fotográfica.
Estilo hiper-realista, arquitetura contemporânea, qualidade ultra
alta, render com aparência de foto real.
IMPORTANTE Não altere nenhuma textura e nenhum formato da
imagem base original",
  chuva: "Transforme o print do SketchUp em uma imagem fotorealista de fachada
residencial, mantendo 100% da volumetria, proporções e elementos
originais do projeto.
Aplique materiais e revestimentos realistas, com texturas em alta
resolução, respeitando fielmente os materiais já presentes na imagem.
Condições de iluminação:
Cena em dia chuvoso, céu totalmente nublado, luz difusa e suave
Ausência de sol direto e sombras duras
Reflexos realistas de água no piso e superfícies
Atmosfera e realismo:
Leve efeito de chuva no ambiente (sem exagero)
Umidade visível nos materiais
Cores naturais e levemente dessaturadas, típicas de clima chuvoso
Qualidade visual:
Estilo fotografia profissional de arquitetura
Lente 35mm, perspectiva realista
Alta nitidez, iluminação natural, pós-processamento sutil
Não alterar o design, cores, formas ou arquitetura original
Não adicionar ou remover elementos da fachada
IMPORTANTE Não altere nenhuma textura e nenhum formato da imagem
base original",
  amanhecer: "sunrise soft lighting, pastel pink lavender sky, low morning mist, gentle warm golden light, serene peaceful atmosphere",

  piscina: "Converta este print 3D em uma fotografia arquitetônica profissional ultra-realista, como se tivesse sido
capturada por um fotógrafo especializado em arquitetura utilizando câmera DSLR/full-frame de alto
padrão, resolução 4K.
Requisitos obrigatórios de realismo:
• Aparência 100% fotográfica, sem qualquer aspecto de render, ilustração ou CGI
• Texturas extremamente realistas, com materiais naturais e fielmente aplicados aos revestimentos
originais do projeto
• Nitidez profissional, profundidade de campo natural e balanço de cores realista
Cenário e iluminação:
• Cena diurna, com céu azul limpo, sol presente e sombras naturais suaves
• Iluminação solar realista, com reflexos físicos precisos na água da piscina
• Reflexos especulares, caustics sutis e variação de luz conforme o ângulo do sol
Área de lazer externa:
• Piscina de alvenaria com revestimento realista em pastilhas ou azulejos
• Água cristalina, com transparência, reflexos e leve ondulação natural
• Deck externo em madeira natural ou porcelanato, com textura e desgaste real
• Espreguiçadeiras realistas, guarda-sol de tecido natural e mobiliário externo sofisticado
Restrições absolutas:
• Não alterar a arquitetura, volumetria, proporções ou layout do projeto original
• Manter fielmente o enquadramento, ângulo de câmera e composição da imagem enviada
Resultado final desejado:
Uma imagem indistinguível de uma fotografia real de alto padrão, pronta para uso em portfólio
arquitetônico, marketing imobiliário ou lançamento de empreendimentos
IMPORTANTE Não altere nenhuma textura e nenhum formato da imagem base original",
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
