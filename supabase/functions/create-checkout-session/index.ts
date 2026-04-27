// @ts-nocheck
// This file runs in Deno environment on Supabase Edge Functions
// TypeScript errors are expected in local IDE due to Deno-specific APIs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-custom-auth",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    console.log("[create-checkout-session] Request recebida");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl) throw new Error("SUPABASE_URL não configurada");
    if (!supabaseAnonKey) throw new Error("SUPABASE_ANON_KEY não configurada");
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY não configurada");

    // Logar todos os headers recebidos para debug
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => { allHeaders[key.toLowerCase()] = value; });
    console.log("[create-checkout-session] Headers recebidos:", JSON.stringify(allHeaders));

    // Ler o body da requisição
    const body = await req.json();
    console.log("[create-checkout-session] Body recebido:", JSON.stringify({ ...body, accessToken: body.accessToken ? "PRESENTE" : "AUSENTE" }));

    // Obter token do body (gateway não intercepta body)
    const userToken = body.accessToken;
    console.log("[create-checkout-session] Token do body:", userToken ? "SIM (len=" + userToken.length + ")" : "NÃO");

    if (!userToken) {
      throw new Error("Token de autenticação ausente no body");
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${userToken}` } },
    });

    // Verificar usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log("[create-checkout-session] Usuário:", user?.email || "NÃO autenticado", "Erro:", userError?.message || "nenhum");

    if (userError || !user) {
      throw new Error("Usuário não autenticado. Faça login novamente.");
    }

    const { productCode, mode, successUrl, cancelUrl } = body;

    if (!productCode || !mode || !successUrl || !cancelUrl) {
      throw new Error("Payload inválido: productCode, mode, successUrl e cancelUrl são obrigatórios");
    }

    if (mode !== "subscription" && mode !== "payment") {
      throw new Error("mode deve ser subscription ou payment");
    }

    const priceMap: Record<string, string | undefined> = {
      starter: Deno.env.get("STRIPE_PRICE_STARTER"),
      pro: Deno.env.get("STRIPE_PRICE_PRO"),
      credits_10: Deno.env.get("STRIPE_PRICE_CREDITS_10"),
      credits_30: Deno.env.get("STRIPE_PRICE_CREDITS_30"),
      credits_100: Deno.env.get("STRIPE_PRICE_CREDITS_100"),
    };
    const priceId = priceMap[productCode];
    if (!priceId) {
      throw new Error(`Price ID não configurado para productCode=${productCode}. Verifique os secrets STRIPE_PRICE_* no Supabase.`);
    }

    const body = new URLSearchParams();
    body.append("mode", mode);
    body.append("line_items[0][price]", priceId);
    body.append("line_items[0][quantity]", "1");
    body.append("success_url", successUrl);
    body.append("cancel_url", cancelUrl);
    body.append("customer_email", user.email || "");
    body.append("metadata[userId]", user.id);
    body.append("metadata[priceId]", priceId);
    body.append("metadata[productCode]", productCode);

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const stripeData = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error("Stripe create-checkout-session error:", stripeData);
      throw new Error(stripeData?.error?.message || "Falha ao criar sessão de checkout");
    }

    return new Response(JSON.stringify({ url: stripeData.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
