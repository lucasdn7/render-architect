import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    console.log("[create-checkout-session] Request recebida");
    console.log("[create-checkout-session] Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));

    const authHeader = req.headers.get("Authorization");
    console.log("[create-checkout-session] Auth header:", authHeader ? "Presente" : "AUSENTE");

    if (!authHeader) throw new Error("Token de autenticação ausente");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    console.log("[create-checkout-session] SUPABASE_URL:", supabaseUrl ? "Configurado" : "AUSENTE");
    console.log("[create-checkout-session] SUPABASE_ANON_KEY:", supabaseAnonKey ? "Configurado" : "AUSENTE");
    console.log("[create-checkout-session] STRIPE_SECRET_KEY:", stripeSecretKey ? "Configurado" : "AUSENTE");

    if (!supabaseUrl) throw new Error("SUPABASE_URL não configurada");
    if (!supabaseAnonKey) throw new Error("SUPABASE_ANON_KEY não configurada");
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY não configurada");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log("[create-checkout-session] Client Supabase criado, verificando usuário...");

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log("[create-checkout-session] getUser resultado:", user ? "Usuário encontrado" : "Usuário NÃO encontrado", "Erro:", userError ? userError.message : "Nenhum");

    if (userError || !user) {
      console.error("[create-checkout-session] Erro de autenticação:", userError);
      throw new Error("Usuário não autenticado");
    }

    console.log("[create-checkout-session] Usuário autenticado:", user.email);

    const { productCode, mode, successUrl, cancelUrl } = await req.json();

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
