import { useState, useEffect } from "react";
import ProfileLayout from "@/components/ProfileLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  unitPrice: number;
  popular?: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  features: string[];
  current?: boolean;
  popular?: boolean;
}

export default function Credits() {
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  const creditPackages: CreditPackage[] = [
    {
      id: "10",
      name: "10 prompts",
      credits: 10,
      price: 14.90,
      unitPrice: 1.49
    },
    {
      id: "30",
      name: "30 prompts",
      credits: 30,
      price: 34.90,
      unitPrice: 1.16,
      popular: true
    },
    {
      id: "100",
      name: "100 prompts",
      credits: 100,
      price: 99.90,
      unitPrice: 0.99
    }
  ];

  const plans: Plan[] = [
    {
      id: "free",
      name: "Gratuito",
      price: 0,
      features: [
        "5 prompts para começar",
        "Upload + análise IA"
      ],
      current: true
    },
    {
      id: "starter",
      name: "Starter",
      price: 29,
      features: [
        "30 prompts/mês",
        "Upload + análise IA",
        "Histórico completo",
        "Sem marca d'água"
      ],
      popular: true
    },
    {
      id: "pro",
      name: "Pro",
      price: 79,
      features: [
        "100 prompts/mês",
        "Tudo do Starter",
        "Exportar .txt",
        "Prompts favoritos"
      ]
    }
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('subscription_plan')
        .eq('user_id', user.id)
        .single();

      const currentPlanId = creditsData?.subscription_plan || 'free';
      const plan = plans.find(p => p.id === currentPlanId);
      setCurrentPlan(plan || null);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseCredits = async (pkg: CreditPackage) => {
    try {
      // TODO: Integrate with payment gateway (Stripe/Mercado Pago)
      toast.info('Em breve - integração com gateway de pagamento');
    } catch (error) {
      toast.error('Erro ao processar compra');
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    try {
      // TODO: Integrate with payment gateway
      toast.info('Em breve - integração com gateway de pagamento');
    } catch (error) {
      toast.error('Erro ao processar upgrade');
    }
  };

  const handleCancelSubscription = async () => {
    try {
      // TODO: Implement subscription cancellation
      toast.info('Em breve - cancelamento de assinatura');
    } catch (error) {
      toast.error('Erro ao cancelar assinatura');
    }
  };

  if (loading) {
    return (
      <ProfileLayout title="Créditos & Plano" subtitle="Escolha o plano ideal ou compre créditos avulsos">
        <div className="space-y-8">
          {/* Skeleton Current Plan */}
          <div className="p-8 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
            <div className="h-6 w-32 rounded mb-4" style={{ background: "#1a1a1a" }} />
            <div className="h-8 w-48 rounded mb-4" style={{ background: "#1a1a1a" }} />
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 w-64 rounded" style={{ background: "#1a1a1a" }} />
              ))}
            </div>
          </div>
          
          {/* Skeleton Plans */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
                <div className="h-6 w-24 rounded mb-4" style={{ background: "#1a1a1a" }} />
                <div className="h-8 w-20 rounded mb-4" style={{ background: "#1a1a1a" }} />
                <div className="space-y-2 mb-6">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="h-3 w-48 rounded" style={{ background: "#1a1a1a" }} />
                  ))}
                </div>
                <div className="h-10 w-full rounded" style={{ background: "#1a1a1a" }} />
              </div>
            ))}
          </div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout title="Créditos & Plano" subtitle="Escolha o plano ideal ou compre créditos avulsos">
      <div className="space-y-8">
        {/* Current Plan */}
        <div className="p-8 rounded-xl border" style={{ 
          background: "#111111", 
          borderColor: currentPlan?.id !== 'free' ? "#C9A84C" : "#1e1e1e" 
        }}>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="font-mono text-xs text-muted-foreground mb-2">PLANO ATUAL</div>
              <div className="font-display text-2xl text-white mb-4">{currentPlan?.name}</div>
              <div className="space-y-2">
                {currentPlan?.features.map((feature, index) => (
                  <div key={index} className="font-mono text-sm text-muted-foreground flex items-center gap-2">
                    <span style={{ color: "#C9A84C" }}>✓</span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-2xl mb-2" style={{ color: "#C9A84C" }}>
                {currentPlan?.price === 0 ? 'Gratuito' : `R$ ${currentPlan?.price}`}
                {currentPlan?.price && currentPlan.price > 0 && (
                  <span className="font-mono text-sm text-muted-foreground">/mês</span>
                )}
              </div>
              {currentPlan?.price && currentPlan.price > 0 && (
                <div className="font-mono text-xs text-muted-foreground mb-4">
                  Renova em 15/05/2025
                </div>
              )}
              <div className="space-y-2">
                {currentPlan?.id !== 'pro' && (
                  <button
                    onClick={() => handleUpgradePlan('starter')}
                    className="px-6 py-3 rounded-lg font-mono text-sm font-bold transition-colors duration-200"
                    style={{ background: "#C9A84C", color: "#000" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#b89440";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#C9A84C";
                    }}
                  >
                    Fazer Upgrade
                  </button>
                )}
                {currentPlan?.price && currentPlan.price > 0 && (
                  <button
                    onClick={handleCancelSubscription}
                    className="px-6 py-3 rounded-lg font-mono text-sm transition-colors duration-200 block w-full"
                    style={{ border: "1px solid #333", color: "#888" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#c0392b";
                      e.currentTarget.style.color = "#c0392b";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#333";
                      e.currentTarget.style.color = "#888";
                    }}
                  >
                    Cancelar assinatura
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plan Upgrade */}
        {currentPlan?.id !== 'pro' && (
          <div>
            <div className="font-mono text-xs font-medium mb-4" style={{ color: "#C9A84C" }}>
              PLANOS DISPONÍVEIS
            </div>
            <div className="grid grid-cols-3 gap-4">
              {plans.filter(plan => plan.id !== currentPlan?.id).map((plan) => (
                <div key={plan.id} className="p-6 rounded-xl border" style={{ 
                  background: "#111111", 
                  borderColor: plan.popular ? "#C9A84C" : "#1e1e1e" 
                }}>
                  {plan.popular && (
                    <div className="inline-block px-3 py-1 rounded-full text-xs font-mono mb-4"
                      style={{ background: "#C9A84C", color: "#000" }}>
                      MAIS POPULAR
                    </div>
                  )}
                  <div className="font-display text-xl text-white mb-2">{plan.name}</div>
                  <div className="font-display text-2xl mb-4" style={{ color: "#C9A84C" }}>
                    {plan.price === 0 ? 'Gratuito' : `R$ ${plan.price}/mês`}
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
                    onClick={() => handleUpgradePlan(plan.id)}
                    className={`w-full px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200 ${
                      plan.popular 
                        ? 'font-bold' 
                        : ''
                    }`}
                    style={{
                      background: plan.popular ? "#C9A84C" : "transparent",
                      color: plan.popular ? "#000" : "#C9A84C",
                      border: plan.popular ? "none" : "1px solid #C9A84C"
                    }}
                    onMouseEnter={(e) => {
                      if (plan.popular) {
                        e.currentTarget.style.background = "#b89440";
                      } else {
                        e.currentTarget.style.background = "#1a1400";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = plan.popular ? "#C9A84C" : "transparent";
                    }}
                  >
                    {plan.price === 0 ? 'Plano atual' : plan.popular ? 'Assinar agora' : `Assinar ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Packages */}
        <div>
          <div className="font-mono text-xs font-medium mb-2" style={{ color: "#C9A84C" }}>
            CRÉDITOS AVULSOS
          </div>
          <div className="font-mono text-xs text-muted-foreground mb-4">
            Não expiram · Somam com os créditos do plano · Cada crédito avulso libera recursos de Pro ao consumir
          </div>
          <div className="grid grid-cols-3 gap-4">
            {creditPackages.map((pkg) => (
              <div key={pkg.id} className="p-6 rounded-xl border" style={{ 
                background: "#111111", 
                borderColor: pkg.popular ? "#C9A84C" : "#1e1e1e" 
              }}>
                {pkg.popular && (
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-mono mb-4"
                    style={{ background: "#1a1400", border: "1px solid #C9A84C", color: "#C9A84C" }}>
                    ✦ MELHOR VALOR
                  </div>
                )}
                <div className="font-display text-lg text-white mb-2">{pkg.name}</div>
                <div className="font-display text-2xl mb-2" style={{ color: "#C9A84C" }}>
                  R$ {pkg.price.toFixed(2).replace('.', ',')}
                </div>
                <div className="font-mono text-xs text-muted-foreground mb-4">
                  R$ {pkg.unitPrice.toFixed(2).replace('.', ',')}/un
                </div>
                <button
                  onClick={() => handlePurchaseCredits(pkg)}
                  className={`w-full px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200 ${
                    pkg.popular 
                        ? 'font-bold' 
                        : ''
                  }`}
                  style={{
                    background: pkg.popular ? "#C9A84C" : "transparent",
                    color: pkg.popular ? "#000" : "#C9A84C",
                    border: pkg.popular ? "none" : "1px solid #C9A84C"
                  }}
                  onMouseEnter={(e) => {
                    if (pkg.popular) {
                      e.currentTarget.style.background = "#b89440";
                    } else {
                      e.currentTarget.style.background = "#1a1400";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = pkg.popular ? "#C9A84C" : "transparent";
                  }}
                >
                  Comprar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        <div>
          <div className="font-mono text-xs font-medium mb-4" style={{ color: "#C9A84C" }}>
            HISTÓRICO DE PAGAMENTOS
          </div>
          <div className="p-8 rounded-xl border text-center" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
            <div className="font-mono text-sm text-muted-foreground">
              Nenhuma transação ainda
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
