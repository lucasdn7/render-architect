import { supabase } from "@/integrations/supabase/client";

export type PaymentMode = "subscription" | "payment";

export interface CheckoutPayload {
  priceId: string;
  mode: PaymentMode;
}

export async function createStripeCheckoutSession(payload: CheckoutPayload): Promise<string> {
  const successUrl = `${window.location.origin}/creditos?checkout=success`;
  const cancelUrl = `${window.location.origin}/creditos?checkout=cancel`;

  const { data, error } = await supabase.functions.invoke("create-checkout-session", {
    body: {
      ...payload,
      successUrl,
      cancelUrl,
    },
  });

  if (error) throw new Error(error.message || "Erro ao iniciar checkout");
  if (!data?.url) throw new Error("URL de checkout não retornada");

  return data.url as string;
}

export interface CreatePixOrderInput {
  type: "subscription" | "credits";
  plan?: "starter" | "pro";
  creditsAmount?: 10 | 30 | 100;
  amountBrl: number;
}

export async function createPixOrder(input: CreatePixOrderInput) {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) throw new Error("Usuário não autenticado");

  const { data, error } = await supabase
    .from("pix_orders")
    .insert({
      user_id: userId,
      type: input.type,
      plan: input.plan ?? null,
      credits_amount: input.creditsAmount ?? null,
      amount_brl: input.amountBrl,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message || "Erro ao criar pedido PIX");
  return data;
}
