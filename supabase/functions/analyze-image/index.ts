import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PERSONA = `You are a senior architect, urbanist, and interior designer with 20 years of experience, specialized in generating photorealistic AI image prompts for architectural renders. You have deep knowledge of 3D rendering, lighting techniques, materials, spatial composition, and photographic principles. You always write prompts in English, highly technical, optimized for Midjourney, DALL-E 3, and Adobe Firefly.`;

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

    const API_KEY = Deno.env.get("COMET_API_KEY") || Deno.env.get("OPENAI_API_KEY") || "test-key-replace-with-real-key";
    const API_MODEL = Deno.env.get("COMET_MODEL") || Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";
    const API_BASE_URL = Deno.env.get("COMET_API_URL") || "https://api.cometapi.com";

    if (!API_KEY || API_KEY === "test-key-replace-with-real-key") {
      return new Response(JSON.stringify({ 
        error: "API_KEY não configurada. Adicione sua chave da API (CometAPI ou OpenAI) nas variáveis de ambiente do Supabase." 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
            content: [
              {
                type: "image_url",
                image_url: { url: base64Image },
              },
              {
                type: "text",
                text: `As a world-class architect and visualization expert, conduct an exhaustive technical analysis of this architectural image. Provide exceptional detail and precision in your evaluation. Return ONLY a valid JSON object with these comprehensive fields:

{
  "IMAGE_TYPE": "precise classification (photorealistic 3D render, architectural photography, concept sketch, technical drawing, floor plan, elevation, section, axonometric)",
  "ARCHITECTURAL_STYLE": "detailed style identification (Modernist, Brutalist, Art Deco, Neoclassical, Contemporary, Parametric, Minimalist, Industrial, Scandinavian, etc.)",
  "ENVIRONMENT": "spatial context (interior residential, interior commercial, exterior urban, exterior rural, mixed-use, public space, landscape)",
  "MATERIALS": "comprehensive material list with technical specifications (concrete, steel, glass, wood species, stone types, composite materials, finishes, textures)",
  "OBJECTS": "detailed inventory (furniture pieces, lighting fixtures, decorative elements, vegetation species, architectural features, structural elements)",
  "LIGHTING": "complete lighting analysis (natural daylight, artificial lighting, time of day, light direction, intensity, color temperature, shadows, reflections)",
  "COLORS": "sophisticated color palette (primary, secondary, accent colors with specific names and psychological impact)",
  "TEXTURES": "detailed texture identification (smooth, rough, polished, matte, grain patterns, surface treatments, material properties)",
  "SPATIAL_COMPOSITION": "advanced composition analysis (camera angle, lens type, perspective, depth of field, framing, scale, proportion, balance)",
  "ARCHITECTURAL_DETAILS": "comprehensive detail catalog (structural systems, facade treatments, window types, roofing materials, joinery, connections, architectural elements)",
  "ATMOSPHERE": "detailed atmospheric description (mood, emotional impact, sensory experience, environmental conditions, cultural context)",
  "FULL_DESCRIPTION": "An extensive, richly detailed paragraph (8-12 lines) that synthesizes all analysis into a master architectural render prompt with exceptional technical vocabulary and artistic vision"
}

Provide the most thorough and detailed analysis possible. Return ONLY the JSON. No explanations, no markdown formatting, no additional text.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 401) {
        return new Response(JSON.stringify({ error: "Chave da OpenAI inválida ou não configurada corretamente." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const errorText = await response.text();
      console.error("OpenAI error:", status, errorText);
      throw new Error(`OpenAI error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const analysis = JSON.parse(jsonStr);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro ao analisar imagem" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
