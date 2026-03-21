import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PERSONA = `You are a senior architect, urbanist, and interior designer with 20 years of experience, specialized in generating photorealistic AI image prompts for architectural renders. You always write prompts in English, highly technical, optimized for Midjourney, DALL-E 3, and Adobe Firefly. Your prompts are precise, vivid, and produce award-winning architectural visualizations.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageDescription, selectedPrompts, humanizationText } = await req.json();

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
            content: `You are assembling the final prompt for a photorealistic architectural render. Combine the blocks below into ONE single cohesive prompt in English. Remove all redundancies, resolve contradictions, ensure perfect flow. Return ONLY the final prompt text, nothing else.

## IMAGE DESCRIPTION:
${imageDescription}

## RENDER CONFIGURATIONS:
${Array.isArray(selectedPrompts) ? selectedPrompts.join(', ') : selectedPrompts}

${humanizationText ? `## HUMANIZATION:\n${humanizationText}` : ''}

Rules:
- Single continuous text, no line breaks
- Comma-separated technical terms
- Most important architectural elements first
- End with technical render parameters
- Maximum 200 words`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições excedido.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos esgotados.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', status, errorText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const data = await response.json();
    const prompt = data.choices?.[0]?.message?.content?.trim() || '';

    return new Response(JSON.stringify({ prompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('generate-prompt error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Erro ao gerar prompt' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
