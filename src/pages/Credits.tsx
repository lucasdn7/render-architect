import { useState, useEffect, useMemo } from "react";
import ProfileLayout from "@/components/ProfileLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { CheckoutProductCode, createStripeCheckoutSession, createPixOrder } from "@/lib/payments";
import { buildPixQrCodeUrl, generatePixPayload } from "@/lib/pix";

interface CreditPackage {
  id: "10" | "30" | "100";
  name: string;
  credits: 10 | 30 | 100;
  price: number;
  unitPrice: number;
  popular?: boolean;
}

interface Plan {
  id: "free" | "starter" | "pro";
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

type ProductSelection =
  | { type: "subscription"; plan: "starter" | "pro"; label: string; amountBrl: number; productCode: CheckoutProductCode }
  | { type: "credits"; credits: 10 | 30 | 100; label: string; amountBrl: number; productCode: CheckoutProductCode };

interface PixState {
  orderId: string;
  amountBrl: number;
  payload: string;
  qrCodeUrl: string;
  label: string;
}

const PIX_KEY = import.meta.env.VITE_PIX_KEY || "";

export default function Credits() {
  const [currentPlan, setCurrentPlan] = useState<Plan["id"]>("free");
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSelection | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [pixState, setPixState] = useState<PixState | null>(null);
  const [pixAcknowledged, setPixAcknowledged] = useState(false);

  const creditPackages: CreditPackage[] = [
    { id: "10", name: "10 prompts", credits: 10, price: 14.9, unitPrice: 1.49 },
    { id: "30", name: "30 prompts", credits: 30, price: 34.9, unitPrice: 1.16, popular: true },
    { id: "100", name: "100 prompts", credits: 100, price: 99.9, unitPrice: 0.99 },
  ];

  const plans: Plan[] = [
    { id: "free", name: "Gratuito", price: 0, features: ["5 prompts para começar", "Upload + análise IA"] },
    {
      id: "starter",
      name: "Starter",
      price: 29,
      features: ["30 prompts/mês", "Upload + análise IA", "Histórico completo", "Sem marca d'água"],
      popular: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: 79,
      features: ["100 prompts/mês", "Tudo do Starter", "Exportar .txt", "Prompts favoritos"],
    },
  ];

  const currentPlanData = useMemo(() => plans.find((plan) => plan.id === currentPlan) ?? plans[0], [currentPlan]);

  useEffect(() => {
    loadUserData();

    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");
    if (checkoutStatus === "success") {
      toast.success("Pagamento confirmado! Atualizando seus créditos/plano...");
      loadUserData();
      window.history.replaceState({}, "", "/creditos");
    }
    if (checkoutStatus === "cancel") {
      toast.info("Pagamento cancelado.");
      window.history.replaceState({}, "", "/creditos");
    }
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", authData.user.id)
        .single();

      setCurrentPlan((profileData?.plan as Plan["id"] | null) ?? "free");
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Erro ao carregar dados do usuário");
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (product: ProductSelection) => {
    setSelectedProduct(product);
    setPaymentModalOpen(true);
  };

  const handleUpgradePlan = (planId: "starter" | "pro") => {
    const label = planId === "starter" ? "Plano Starter" : "Plano Pro";
    const amountBrl = planId === "starter" ? 29 : 79;
    const productCode: CheckoutProductCode = planId === "starter" ? "starter" : "pro";

    openPaymentModal({ type: "subscription", plan: planId, label, amountBrl, productCode });
  };

  const handlePurchaseCredits = (pkg: CreditPackage) => {
    const productCodeMap: Record<10 | 30 | 100, CheckoutProductCode> = {
      10: "credits_10",
      30: "credits_30",
      100: "credits_100",
    } as const;

    openPaymentModal({
      type: "credits",
      credits: pkg.credits,
      label: `${pkg.credits} créditos avulsos`,
      amountBrl: pkg.price,
      productCode: productCodeMap[pkg.credits],
    });
  };

  const handleStripePayment = async () => {
    if (!selectedProduct) return;

    try {
      setCheckoutLoading(true);
      const mode = selectedProduct.type === "subscription" ? "subscription" : "payment";
      const checkoutUrl = await createStripeCheckoutSession({
        productCode: selectedProduct.productCode,
        mode,
      });
      window.location.href = checkoutUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao iniciar checkout";
      toast.error(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePixPayment = async () => {
    if (!selectedProduct) return;
    if (!PIX_KEY) {
      toast.error("VITE_PIX_KEY não configurada.");
      return;
    }

    try {
      setCheckoutLoading(true);
      const pixOrder = await createPixOrder({
        type: selectedProduct.type,
        plan: selectedProduct.type === "subscription" ? selectedProduct.plan : undefined,
        creditsAmount: selectedProduct.type === "credits" ? selectedProduct.credits : undefined,
        amountBrl: selectedProduct.amountBrl,
      });

      const payload = generatePixPayload({
        pixKey: PIX_KEY,
        amountBrl: selectedProduct.amountBrl,
        description: `PromptRender - ${selectedProduct.label}`,
        orderId: pixOrder.id,
      });

      setPixState({
        orderId: pixOrder.id,
        amountBrl: selectedProduct.amountBrl,
        payload,
        qrCodeUrl: buildPixQrCodeUrl(payload),
        label: selectedProduct.label,
      });
      setPixAcknowledged(false);
      setPaymentModalOpen(false);
      setPixModalOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao gerar pedido PIX";
      toast.error(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (!pixState) return;
    try {
      await navigator.clipboard.writeText(pixState.payload);
      toast.success("Código PIX copiado!");
    } catch {
      toast.error("Não foi possível copiar o código PIX.");
    }
  };

  if (loading) {
    return (
      <ProfileLayout title="Créditos & Plano" subtitle="Escolha o plano ideal ou compre créditos avulsos">
        <div className="space-y-8">
          <div className="p-8 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
            <div className="h-6 w-32 rounded mb-4" style={{ background: "#1a1a1a" }} />
            <div className="h-8 w-48 rounded mb-4" style={{ background: "#1a1a1a" }} />
          </div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout title="Créditos & Plano" subtitle="Escolha o plano ideal ou compre créditos avulsos">
      <div className="space-y-8">
        <div className="p-8 rounded-xl border" style={{ background: "#111111", borderColor: currentPlan !== "free" ? "#C9A84C" : "#1e1e1e" }}>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="font-mono text-xs text-muted-foreground mb-2">PLANO ATUAL</div>
              <div className="font-display text-2xl text-white mb-4">{currentPlanData.name}</div>
              <div className="space-y-2">
                {currentPlanData.features.map((feature, index) => (
                  <div key={index} className="font-mono text-sm text-muted-foreground flex items-center gap-2">
                    <span style={{ color: "#C9A84C" }}>✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl mb-2" style={{ color: "#C9A84C" }}>
                {currentPlanData.price === 0 ? "Gratuito" : `R$ ${currentPlanData.price}`}
                {currentPlanData.price > 0 && <span className="font-mono text-sm text-muted-foreground">/mês</span>}
              </div>
            </div>
          </div>
        </div>

        {currentPlan !== "pro" && (
          <div>
            <div className="font-mono text-xs font-medium mb-4" style={{ color: "#C9A84C" }}>
              PLANOS DISPONÍVEIS
            </div>
            <div className="grid grid-cols-3 gap-4">
              {plans
                .filter((plan) => plan.id !== "free" && plan.id !== currentPlan)
                .map((plan) => (
                  <div key={plan.id} className="p-6 rounded-xl border" style={{ background: "#111111", borderColor: plan.popular ? "#C9A84C" : "#1e1e1e" }}>
                    <div className="font-display text-xl text-white mb-2">{plan.name}</div>
                    <div className="font-display text-2xl mb-4" style={{ color: "#C9A84C" }}>
                      R$ {plan.price}/mês
                    </div>
                    <div className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="font-mono text-sm text-muted-foreground flex items-center gap-2">
                          <span style={{ color: "#C9A84C" }}>✓</span>
                          {feature}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => handleUpgradePlan(plan.id as "starter" | "pro")}
                      className="w-full px-4 py-3 rounded-lg font-mono text-sm font-bold"
                      style={{ background: plan.popular ? "#C9A84C" : "transparent", color: plan.popular ? "#000" : "#C9A84C", border: plan.popular ? "none" : "1px solid #C9A84C" }}
                    >
                      {plan.popular ? "Assinar agora" : `Assinar ${plan.name}`}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div>
          <div className="font-mono text-xs font-medium mb-2" style={{ color: "#C9A84C" }}>
            CRÉDITOS AVULSOS
          </div>
          <div className="font-mono text-xs text-muted-foreground mb-4">
            Não expiram · Somam com os créditos do plano · Cada crédito avulso libera recursos de Pro ao consumir
          </div>
          <div className="grid grid-cols-3 gap-4">
            {creditPackages.map((pkg) => (
              <div key={pkg.id} className="p-6 rounded-xl border" style={{ background: "#111111", borderColor: pkg.popular ? "#C9A84C" : "#1e1e1e" }}>
                <div className="font-display text-lg text-white mb-2">{pkg.name}</div>
                <div className="font-display text-2xl mb-2" style={{ color: "#C9A84C" }}>
                  R$ {pkg.price.toFixed(2).replace(".", ",")}
                </div>
                <div className="font-mono text-xs text-muted-foreground mb-4">R$ {pkg.unitPrice.toFixed(2).replace(".", ",")}/un</div>
                <button
                  onClick={() => handlePurchaseCredits(pkg)}
                  className="w-full px-4 py-3 rounded-lg font-mono text-sm"
                  style={{ background: pkg.popular ? "#C9A84C" : "transparent", color: pkg.popular ? "#000" : "#C9A84C", border: pkg.popular ? "none" : "1px solid #C9A84C" }}
                >
                  Comprar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
          <DialogTitle className="font-display text-2xl text-white">Escolha a forma de pagamento</DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            {selectedProduct?.label} · R$ {selectedProduct?.amountBrl.toFixed(2).replace(".", ",")}
          </DialogDescription>

          <div className="space-y-3 mt-3">
            <button
              onClick={handleStripePayment}
              disabled={checkoutLoading}
              className="w-full p-4 rounded-lg text-left border font-mono"
              style={{ borderColor: "#333", color: "#fff", background: "#111" }}
            >
              💳 Cartão de crédito (Stripe Checkout)
            </button>
            <button
              onClick={handlePixPayment}
              disabled={checkoutLoading}
              className="w-full p-4 rounded-lg text-left border font-mono"
              style={{ borderColor: "#C9A84C", color: "#C9A84C", background: "#1a1400" }}
            >
              🏦 PIX (manual)
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pixModalOpen} onOpenChange={setPixModalOpen}>
        <DialogContent className="max-w-lg border" style={{ background: "#0f0f0f", borderColor: "#1e1e1e" }}>
          <DialogTitle className="font-display text-2xl text-white">Pagamento via PIX</DialogTitle>
          <DialogDescription className="font-mono text-xs text-muted-foreground">
            {pixState?.label} · R$ {pixState?.amountBrl.toFixed(2).replace(".", ",")}
          </DialogDescription>

          {pixState && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={pixState.qrCodeUrl} alt="QR Code PIX" className="w-72 h-72 rounded-lg border" style={{ borderColor: "#333" }} />
              </div>

              <div>
                <p className="font-mono text-xs mb-2 text-muted-foreground">PIX Copia e Cola</p>
                <textarea
                  value={pixState.payload}
                  readOnly
                  rows={4}
                  className="w-full p-3 rounded-lg font-mono text-xs"
                  style={{ background: "#111", border: "1px solid #333", color: "#fff" }}
                />
                <button onClick={copyPixCode} className="mt-2 px-4 py-2 rounded-lg font-mono text-xs" style={{ background: "#C9A84C", color: "#000" }}>
                  Copiar código
                </button>
              </div>

              <div className="font-mono text-xs text-muted-foreground">
                Após o pagamento, seu acesso será liberado em até 1 hora útil.
              </div>

              <button
                onClick={() => {
                  setPixAcknowledged(true);
                  toast.success("Recebido! Seu pedido está aguardando confirmação manual.");
                }}
                className="w-full px-4 py-3 rounded-lg font-mono text-sm"
                style={{ background: "#C9A84C", color: "#000" }}
              >
                Já paguei
              </button>

              {pixAcknowledged && (
                <div className="font-mono text-xs" style={{ color: "#C9A84C" }}>
                  Pedido registrado como pendente. Acompanhe na sua conta e aguarde confirmação.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ProfileLayout>
  );
}
