import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PERSONA = `You are a senior architect, urbanist, and interior designer with 20 years of experience, specialized in generating photorealistic AI image prompts for architectural renders. You have deep knowledge of 3D rendering, lighting techniques, materials, spatial composition, and photographic principles. You always write prompts in English, highly technical, optimized for Midjourney, DALL-E 3, and Adobe Firefly.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base64Image } = await req.json();
    if (!base64Image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PERSONA },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: base64Image },
              },
              {
                type: 'text',
                text: `As an expert architect and AI prompt specialist, analyze this architectural image in extreme technical detail. Return ONLY a valid JSON object with these exact fields:
{
  "IMAGE_TYPE": "type of image (3D render, real photo, sketch, floor plan...)",
  "ARCHITECTURAL_STYLE": "precise architectural style",
  "ENVIRONMENT": "interior, exterior or mixed",
  "MATERIALS": "all identified materials with technical names",
  "OBJECTS": "all objects, furniture, vegetation, elements present",
  "LIGHTING": "lighting type, direction, quality and apparent time of day",
  "COLORS": "dominant color palette with descriptive names",
  "TEXTURES": "all surface textures identified",
  "SPATIAL_COMPOSITION": "perspective type, camera angle, depth and framing",
  "ARCHITECTURAL_DETAILS": "specific architectural elements: roof, windows, facades, structures",
  "ATMOSPHERE": "overall mood and atmosphere of the image",
  "FULL_DESCRIPTION": "A single cohesive paragraph of 4-6 lines describing everything above as a professional architectural render prompt in English"
}
Return ONLY the JSON. No explanation, no markdown, no extra text.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos esgotados. Adicione créditos na sua conta.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', status, errorText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    const analysis = JSON.parse(jsonStr);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('analyze-image error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro ao analisar imagem' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
