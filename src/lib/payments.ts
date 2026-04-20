import { supabase } from "@/integrations/supabase/client";

export type PaymentMode = "subscription" | "payment";
export type CheckoutProductCode = "starter" | "pro" | "credits_10" | "credits_30" | "credits_100";

export interface CheckoutPayload {
  productCode: CheckoutProductCode;
  mode: PaymentMode;
}

export async function createStripeCheckoutSession(payload: CheckoutPayload): Promise<string> {
  const successUrl = `${window.location.origin}/creditos?checkout=success`;
  const cancelUrl = `${window.location.origin}/creditos?checkout=cancel`;

  // Obter sessão atual para enviar token
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) throw new Error("Usuário não autenticado");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  // Enviar requisição com token de autenticação no header Authorization padrão
  const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout-session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      ...payload,
      successUrl,
      cancelUrl,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao iniciar checkout");
  }

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
