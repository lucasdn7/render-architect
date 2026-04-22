// @ts-nocheck
// Supabase Edge Function — generate-prompt
// promptsConfig embutido diretamente (sem imports locais)
 
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
// ─────────────────────────────────────────────
// PROMPTS CONFIG (embutido)
// ─────────────────────────────────────────────
 
const SYSTEM_PERSONA = `Você é um "Render Master AI", um especialista em visualização arquitetônica com profundo conhecimento em renderização fotorrealista, 
materiais PBR, iluminação avançada e composição fotográfica. Sua missão é interpretar e combinar os blocos de prompt fornecidos para gerar um prompt final coeso e 
tecnicamente otimizado para motores de renderização de última geração.`;
 
const NEGATIVE_PROMPT = `DO NOT ALTER, MODIFY, OR DEVIATE FROM THE ORIGINAL 3D MODEL GEOMETRY. The architectural form, massing, proportions, window placements, door locations, roof pitches, and all structural elements as defined in the base image are ABSOLUTE AND IMMUTABLE. Do not add, remove, or resize any part of the building. Do not change the architectural style. Do not introduce new architectural features not present in the original design. The AI's role is strictly limited to applying photorealistic textures, lighting, atmospheric effects, and vegetation enhancements to the existing, unchanged geometry.
 
DO NOT RENDER 2D drawing elements such as plans, sections, elevations, dimensions, furniture symbols, annotations, or any other drafting elements. Exclude all documentary or technical drawing representations. Preserve the 3D architectural geometry (walls, roofs, windows) rigidly.
 
Vegetation is the sole exception: landscaping elements such as trees, shrubs, ground cover, grass, planters, hedges, and other vegetation blocks may be freely replaced, enhanced, added, or removed to improve realism and visual quality — provided they do not obscure, distort, or conflict with the legibility of the architectural geometry.
 
Preserve all geometric and proportional integrity of the original design without exception. Deformed, distorted, warped, melted, or unrealistic architectural forms are strictly forbidden. Ensure all lines remain straight, all circles perfectly circular, and all architectural angles are rendered with perfect precision as designed.`;
 
const MASTER_MERGE_PROMPT = `As an expert AI prompt meshing system for architectural visualization, your task is to combine selected prompt blocks into a single, coherent, and highly effective rendering prompt. Follow this strict hierarchical order and conflict resolution strategy:
1. TIPO DE RENDER (Mandatório - Selecione UM): Este bloco define a intenção geral da renderização, o estilo e a qualidade global. Ele atua como a diretriz principal para a IA.
2. PERÍODO DO DIA/ILUMINAÇÃO (Mandatório - Selecione UM): Este bloco define as condições de iluminação global, propriedades das fontes de luz (posição do sol, temperatura de cor), condições do céu e efeitos atmosféricos. Ele deve complementar o Tipo de Render sem anular suas diretrizes principais.
3. QUALIDADE / ESTILO DO RENDER (Mandatório - Selecione UM): Este bloco reforça as diretrizes de estilo e qualidade, aplicação geral de materiais PBR, técnicas de iluminação global e a instrução crítica sobre substituição de texturas. Atua como uma passagem final de qualidade.
4. ELEMENTOS DO AMBIENTE (Opcional - Selecione ZERO ou MAIS): Este bloco introduz propriedades detalhadas de materiais (PBR, micro-imperfeições), efeitos de iluminação localizados (cáusticas, perfis IES) e características ambientais específicas (detalhes de vegetação, física da água). Esses detalhes devem ser integrados à cena, respeitando as configurações globais de iluminação e câmera estabelecidas pelos blocos anteriores. Priorize as definições de materiais PBR desses blocos sobre quaisquer menções genéricas de materiais.
5. ENTORNO (Opcional - Selecione ZERO ou MAIS, até DOIS blocos de 'Entorno'): Este bloco define o contexto circundante da arquitetura, como edifícios vizinhos, vegetação, ruas e elementos urbanos. Ele deve ser integrado à cena, respeitando a iluminação global e as configurações da câmera.
6. CÂMERA PERSPECTIVA (Mandatório - Selecione UM): Este bloco estabelece o tipo fundamental de cena, parâmetros da câmera (lente, perspectiva, distância focal, profundidade de campo, balanço de branco, exposição) e instruções de preservação geométrica. Quaisquer instruções relacionadas à câmera de blocos subsequentes devem ser consideradas refinamentos secundários ou ignoradas se contradizerem diretamente a configuração primária da câmera.
7. SUFIXO DE RENDERIZAÇÃO (Mandatório - Anexar SEMPRE ao final): Este sufixo contém instruções de renderização e pós-processamento de alta fidelidade, além de parâmetros específicos do Midjourney. Ele deve ser anexado ao final do prompt gerado, sem modificações.
8. BLOCO DE PRESERVAÇÃO NEGATIVA (Mandatório - Anexar SEMPRE ao final): Este bloco é crucial para garantir que a geometria arquitetônica original do modelo 3D e a precisão do desenho 2D sejam preservadas, evitando distorções ou alterações indesejadas pela IA. Ele deve ser anexado ao final do prompt gerado, sem modificações.`;
 
const MERGE_AGENT = `1. Prioridade Hierárquica: Sempre priorize as instruções dos blocos de nível superior sobre os de nível inferior em caso de conflito direto. A ordem dos blocos é: Câmera > Iluminação > Entorno > Estilo Global.
2. Mesclagem Inteligente: Concatene os prompts de forma fluida, garantindo que a linguagem seja natural e tecnicamente precisa. Evite repetições desnecessárias, mas reforce termos-chave (ex: PBR, ray-traced) quando apropriado.
3. Resolução de Conflitos:
   • Câmera: Se um bloco de estilo ou entorno sugerir uma lente ou ângulo que contradiga o bloco de Câmera selecionado, o bloco de Câmera prevalece. Ajuste o prompt para refletir a intenção do bloco de Câmera.
   • Iluminação: Se um bloco de entorno ou estilo sugerir uma condição de iluminação que contradiga o bloco de Iluminação selecionado, o bloco de Iluminação prevalece. Ajuste o prompt para refletir a intenção do bloco de Iluminação.
   • Materiais PBR: As instruções de materiais PBR em blocos de entorno ou elementos do ambiente devem ser consideradas refinamentos detalhados e integradas, desde que não contradigam a qualidade geral PBR definida no bloco de Estilo Global.
4. Preservação Geométrica: O "BLOCO DE PRESERVAÇÃO NEGATIVA" é absoluto e deve ser anexado ao final do prompt gerado, sem modificações, para garantir a integridade do modelo 3D original.
5. Flexibilidade: Permita a seleção de até dois blocos de "Entorno" e mescle-os de forma harmoniosa, priorizando a clareza e a coerência visual.
6. Saída Final: O resultado deve ser um único prompt de texto, pronto para ser inserido em um gerador de imagem de IA, otimizado para fotorrealismo e precisão arquitetônica.`;
 
const SUFFIX = `Camera simulation: full-frame sensor, 35mm prime lens, F5.6 aperture, ISO 100, 1/250s, correct exposure metering with no blown highlights and full shadow detail retained. Color grading: neutral LUT with slight warm bias, contrast curve lifted at midtones, no artificial saturation boost. Output sharpness equivalent to medium-format architectural photography. Subtle film grain at 3%, real lens vignette, no HDR halo artifacts. The final image must be indistinguishable from a photograph taken on location by a professional architectural photographer. --ar 16:9 --q 2 --v 6.1 --style raw`;
 
// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
 
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
 
// ─────────────────────────────────────────────
// HANDLER
// ─────────────────────────────────────────────
 
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
 
  try {
    const { imageDescription, selectedPrompts, humanizationText } = await req.json();
 
    const API_KEY = Deno.env.get("COMET_API_KEY") || Deno.env.get("OPENAI_API_KEY") || "test-key-replace-with-real-key";
    const API_MODEL = Deno.env.get("COMET_MODEL") || Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    const API_BASE_URL = Deno.env.get("COMET_API_URL") || "https://api.cometapi.com";
 
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
 
    const selectedBlocksText = Array.isArray(selectedPrompts)
      ? selectedPrompts.join("\n\n")
      : String(selectedPrompts || "");
 
    const response = await fetch(`${API_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: API_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PERSONA },
          {
            role: "user",
            content: `${MASTER_MERGE_PROMPT}\n\n${MERGE_AGENT}\n\nBASE_IMAGE_DESCRIPTION:\n${imageDescription}\n\nSELECTED_BLOCKS:\n${selectedBlocksText}\n\nOPTIONAL_PEOPLE_ANIMALS:\n${humanizationText || "(none)"}\n\nGere agora o prompt mesclado.`,
          },
        ],
      }),
    });
 
    if (!response.ok) {
      const status = response.status;
 
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
 
      if (status === 401) {
        return new Response(
          JSON.stringify({ error: "Chave da API inválida ou não configurada corretamente." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
 
      const errorText = await response.text();
      console.error("API error:", status, errorText);
      throw new Error(`API error: ${status}`);
    }
 
    const data = await response.json();
    const mergedPrompt = data.choices?.[0]?.message?.content?.trim() || "";
    const prompt = [mergedPrompt, SUFFIX, NEGATIVE_PROMPT].filter(Boolean).join(" ");
 
    return new Response(JSON.stringify({ prompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prompt error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro ao gerar prompt" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
