import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PERSONA = `You are a senior architect, urbanist, and interior designer with 20 years of experience, specialized in generating photorealistic AI image prompts for architectural renders. You always write prompts in English, highly technical, optimized for Midjourney, DALL-E 3, and Adobe Firefly. Your prompts are precise, vivid, and produce award-winning architectural visualizations.`;

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
            content: `You are a master prompt engineer creating the ultimate photorealistic architectural render prompt. Synthesize all information below into a comprehensive, detailed, and technically precise prompt. Focus on visual excellence, architectural accuracy, and artistic composition.

## IMAGE ANALYSIS:
${imageDescription}

## RENDER ENHANCEMENTS:
${Array.isArray(selectedPrompts) ? selectedPrompts.join(", ") : selectedPrompts}

${humanizationText ? `## HUMAN ELEMENTS:\n${humanizationText}` : ""}

## PROMPT ENGINEERING RULES:
- Create a rich, descriptive paragraph with exceptional detail
- Include specific materials, lighting techniques, and atmospheric conditions
- Incorporate professional photography and 3D rendering terminology
- Emphasize architectural style and spatial composition
- Add camera angles, lens specifications, and render engine details
- Include color grading, post-processing, and artistic direction
- No character limits - prioritize quality over brevity
- Use advanced architectural and visualization vocabulary
- Ensure the prompt generates award-winning architectural imagery

Create a masterpiece prompt that will produce stunning, photorealistic architectural renders with incredible detail and artistic vision.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 401) {
        return new Response(JSON.stringify({ error: "Chave da API inválida ou não configurada corretamente." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const errorText = await response.text();
      console.error("API error:", status, errorText);
      throw new Error(`API error: ${status}`);
    }

    const data = await response.json();
    const prompt = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ prompt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-prompt error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro ao gerar prompt" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
