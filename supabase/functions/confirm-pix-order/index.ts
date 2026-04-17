import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_CREDITS: Record<string, number> = {
  free: 5,
  starter: 30,
  pro: 100,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Token ausente");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) throw new Error("Usuário não autenticado");

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: adminProfile } = await serviceClient
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (adminProfile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Apenas administradores podem confirmar pedidos PIX" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { orderId } = await req.json();
    if (!orderId) throw new Error("orderId é obrigatório");

    const { data: order, error: orderError } = await serviceClient
      .from("pix_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) throw new Error("Pedido PIX não encontrado");
    if (order.status !== "pending") throw new Error("Pedido PIX não está pendente");

    if (order.type === "subscription") {
      const plan = order.plan as "starter" | "pro";
      await serviceClient
        .from("profiles")
        .update({
          plan,
          prompt_credits: PLAN_CREDITS[plan],
          credits_reset_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", order.user_id);
    }

    if (order.type === "credits") {
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("avulso_credits")
        .eq("user_id", order.user_id)
        .single();

      const currentCredits = profile?.avulso_credits ?? 0;

      await serviceClient
        .from("profiles")
        .update({
          avulso_credits: currentCredits + (order.credits_amount || 0),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", order.user_id);
    }

    await serviceClient
      .from("pix_orders")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    return new Response(JSON.stringify({ success: true }), {
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
