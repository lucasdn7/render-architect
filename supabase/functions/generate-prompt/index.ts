// @ts-nocheck
// This file runs in Deno environment on Supabase Edge Functions
// TypeScript errors are expected in local IDE due to Deno-specific APIs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SYSTEM_PERSONA, MASTER_MERGE_PROMPT, MERGE_AGENT, SUFFIX, NEGATIVE_PROMPT } from "../../../src/config/promptsConfig.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const mergedPrompt = data.choices?.[0]?.message?.content?.trim() || "";
    const prompt = [mergedPrompt, SUFFIX, NEGATIVE_PROMPT].filter(Boolean).join(" ");

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
