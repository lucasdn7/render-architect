// @ts-nocheck
// This file runs in Deno environment on Supabase Edge Functions
// TypeScript errors are expected in local IDE due to Deno-specific APIs

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const PLAN_CREDITS: Record<string, number> = {
  free: 5,
  starter: 30,
  pro: 100,
};

function getCreditsPackageByPriceId(priceId: string | null): number {
  const price10 = Deno.env.get("STRIPE_PRICE_CREDITS_10");
  const price30 = Deno.env.get("STRIPE_PRICE_CREDITS_30");
  const price100 = Deno.env.get("STRIPE_PRICE_CREDITS_100");

  if (priceId === price10) return 10;
  if (priceId === price30) return 30;
  if (priceId === price100) return 100;
  return 0;
}

function getPlanByPriceId(priceId: string | null): "starter" | "pro" | null {
  const starterPrice = Deno.env.get("STRIPE_PRICE_STARTER");
  const proPrice = Deno.env.get("STRIPE_PRICE_PRO");

  if (priceId === starterPrice) return "starter";
  if (priceId === proPrice) return "pro";
  return null;
}

async function verifyStripeSignature(payload: string, signatureHeader: string, webhookSecret: string): Promise<boolean> {
  const sigParts = signatureHeader.split(",");
  const timestamp = sigParts.find((part) => part.startsWith("t="))?.replace("t=", "");
  const v1Signature = sigParts.find((part) => part.startsWith("v1="))?.replace("v1=", "");

  if (!timestamp || !v1Signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
  const computed = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("");

  return computed === v1Signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!webhookSecret || !serviceRoleKey || !supabaseUrl) {
      throw new Error("Secrets do webhook não configurados");
    }

    const stripeSignature = req.headers.get("stripe-signature") || "";
    const rawBody = await req.text();

    const isValid = await verifyStripeSignature(rawBody, stripeSignature, webhookSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Assinatura inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(rawBody);

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session?.metadata?.userId as string | undefined;
      const priceId = session?.metadata?.priceId as string | null;

      if (!userId) throw new Error("userId ausente no metadata da sessão");

      if (session.mode === "subscription") {
        const plan = getPlanByPriceId(priceId);
        if (!plan) throw new Error("Price de assinatura não reconhecido");

        // Update profiles table for backward compatibility
        await supabase
          .from("profiles")
          .update({
            plan,
            prompt_credits: PLAN_CREDITS[plan],
            stripe_customer_id: session.customer || null,
            stripe_subscription_id: session.subscription || null,
            credits_reset_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // Update user_credits table (new system)
        await supabase
          .from("user_credits")
          .upsert({
            user_id: userId,
            credits: PLAN_CREDITS[plan],
            total_used: 0,
            subscription_plan: plan,
            bonus_credits: 0,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
            doUpdate: 'credits, subscription_plan, updated_at'
          });
      }

      if (session.mode === "payment") {
        const creditsToAdd = getCreditsPackageByPriceId(priceId);
        if (!creditsToAdd) throw new Error("Price de créditos avulsos não reconhecido");

        // Update profiles table for backward compatibility
        const { data: profile } = await supabase
          .from("profiles")
          .select("avulso_credits")
          .eq("user_id", userId)
          .single();

        const currentAvulso = profile?.avulso_credits ?? 0;

        await supabase
          .from("profiles")
          .update({
            avulso_credits: currentAvulso + creditsToAdd,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        // Update user_credits table (new system)
        const { data: userCredit } = await supabase
          .from("user_credits")
          .select("bonus_credits")
          .eq("user_id", userId)
          .single();

        const currentBonus = userCredit?.bonus_credits ?? 0;

        await supabase
          .from("user_credits")
          .update({
            bonus_credits: currentBonus + creditsToAdd,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      
      // Update profiles table for backward compatibility
      await supabase
        .from("profiles")
        .update({
          plan: "free",
          prompt_credits: PLAN_CREDITS.free,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      // Update user_credits table (new system)
      await supabase
        .from("user_credits")
        .update({
          subscription_plan: "free",
          credits: PLAN_CREDITS.free,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", (
          await supabase
            .from("profiles")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .single()
        )?.user_id);
    }

    if (event.type === "invoice.payment_failed") {
      console.error("Stripe invoice.payment_failed", event.data.object?.id);
    }

    return new Response(JSON.stringify({ received: true }), {
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
