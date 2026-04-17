import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Clock, ArrowRight, Upload, Sparkles, Settings, FileText } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToApp = () => {
    if (user) navigate("/app");
    else setAuthOpen(true);
  };

  const steps = [
    { n: "01", title: "Upload da Imagem", desc: "Envie um print, foto ou render do seu projeto", Icon: Upload },
    { n: "02", title: "Análise por IA", desc: "Nossa IA lê e descreve todos os elementos arquitetônicos", Icon: Sparkles },
    { n: "03", title: "Configurar o Render", desc: "Escolha tipo, iluminação, ambiente e entorno", Icon: Settings },
    { n: "04", title: "Gerar o Prompt", desc: "Receba um prompt detalhado e profissional pronto para usar", Icon: FileText },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a", color: "#fff" }}>
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? "backdrop-blur-md" : ""}`}
        style={{
          background: scrolled ? "rgba(10,10,10,0.8)" : "transparent",
          borderBottom: scrolled ? "1px solid #1e1e1e" : "1px solid transparent",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center gold-gradient">
              <Box className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-lg font-semibold">
              Prompt<span style={{ color: "#C9A84C" }}>Render</span>
            </h1>
          </div>
          <button
            onClick={goToApp}
            className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs transition-colors hover:text-foreground"
            style={{ border: "1px solid #1e1e1e", color: "#888" }}
          >
            <Clock className="w-3.5 h-3.5" />
            Histórico
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="pt-40 pb-24 px-6 text-center max-w-4xl mx-auto animate-fade-up">
        <span
          className="inline-block px-4 py-1.5 rounded-full font-mono text-[10px] tracking-widest uppercase mb-8"
          style={{ background: "rgba(201,168,76,0.08)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }}
        >
          Architectural AI Prompts
        </span>
        <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[1.05] mb-6">
          Transforms your design<br />
          into a <em style={{ color: "#C9A84C" }}>perfect</em> AI prompt
        </h1>
        <p className="font-mono text-sm md:text-base max-w-2xl mx-auto mb-10" style={{ color: "#888" }}>
          Envie um print, foto ou render — nossa IA analisa, configura e gera um prompt
          profissional pronto para usar no Midjourney, Stable Diffusion ou qualquer IA de imagem.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={goToApp}
            className="px-7 py-3.5 rounded-lg font-mono text-sm font-bold transition-transform active:scale-[0.97] flex items-center justify-center gap-2"
            style={{ background: "#C9A84C", color: "#000" }}
          >
            Gerar meu primeiro prompt <ArrowRight className="w-4 h-4" />
          </button>
          <a
            href="#como-funciona"
            className="px-7 py-3.5 rounded-lg font-mono text-sm transition-colors hover:bg-secondary"
            style={{ border: "1px solid #333", color: "#fff" }}
          >
            Ver como funciona
          </a>
        </div>
        <p className="mt-6 font-mono text-xs" style={{ color: "#C9A84C" }}>
          ✦ 3 prompts gratuitos ao criar sua conta ✦
        </p>
      </section>

      {/* STATS */}
      <section className="py-10 px-6" style={{ background: "#111", borderTop: "1px solid #1e1e1e", borderBottom: "1px solid #1e1e1e" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { n: "+2.400", l: "Prompts gerados" },
            { n: "+380", l: "Arquitetos ativos" },
            { n: "98%", l: "Taxa de aprovação" },
          ].map((s, i) => (
            <div key={i} className={i > 0 ? "border-l" : ""} style={{ borderColor: "#1e1e1e" }}>
              <div className="font-display text-3xl md:text-4xl font-semibold" style={{ color: "#C9A84C" }}>{s.n}</div>
              <div className="font-mono text-[10px] md:text-xs mt-1" style={{ color: "#888" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full font-mono text-[10px] tracking-widest uppercase mb-6"
            style={{ background: "rgba(201,168,76,0.08)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }}>
            Step by step
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-semibold">Quatro etapas. Um prompt <em style={{ color: "#C9A84C" }}>perfeito</em>.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map(({ n, title, desc, Icon }) => (
            <div
              key={n}
              className="group p-7 rounded-xl transition-all duration-300"
              style={{ background: "#111", border: "1px solid #1e1e1e" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C9A84C")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e1e1e")}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="font-mono text-xs" style={{ color: "#C9A84C" }}>{n}</span>
                <Icon className="w-5 h-5" style={{ color: "#C9A84C" }} />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2 text-white">{title}</h3>
              <p className="font-mono text-xs leading-relaxed" style={{ color: "#888" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DEMO */}
      <section className="py-24 px-6" style={{ background: "#0d0d0d" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 rounded-full font-mono text-[10px] tracking-widest uppercase mb-6"
              style={{ background: "rgba(201,168,76,0.08)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }}>
              Resultado
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-semibold">Do render ao prompt em segundos</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 items-stretch relative">
            <div className="rounded-xl p-6" style={{ background: "#0a0a0a", border: "1px solid #1e1e1e" }}>
              <p className="font-mono text-[10px] tracking-widest uppercase mb-4" style={{ color: "#C9A84C" }}>Input</p>
              <div className="rounded-lg flex flex-col items-center justify-center py-16 px-4" style={{ border: "2px dashed #1e1e1e", background: "#0d0d0d" }}>
                <Upload className="w-10 h-10 mb-3" style={{ color: "#888" }} />
                <p className="font-mono text-xs" style={{ color: "#888" }}>Print do seu projeto</p>
              </div>
            </div>
            <div className="rounded-xl p-6 relative" style={{ background: "#0a0a0a", border: "1px solid #1e1e1e" }}>
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "#C9A84C" }}>Output</p>
                <span className="font-mono text-[9px] px-2 py-1 rounded-full" style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }}>
                  Pronto para Midjourney
                </span>
              </div>
              <div className="rounded-lg p-4 font-mono text-xs leading-relaxed" style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", color: "#fff" }}>
                Photorealistic architectural render, modern residential facade, sunset lighting with warm golden tones, swimming pool with water reflections, tropical landscaping, wooden deck, cinematic composition, 8K, shot on Hasselblad...
              </div>
            </div>
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center animate-pulse-gold" style={{ background: "#0d0d0d", border: "1px solid #C9A84C" }}>
              <ArrowRight className="w-5 h-5" style={{ color: "#C9A84C" }} />
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full font-mono text-[10px] tracking-widest uppercase mb-6"
            style={{ background: "rgba(201,168,76,0.08)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }}>
            Pricing
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-3">Simples, transparente, sem surpresas</h2>
          <p className="font-mono text-sm" style={{ color: "#888" }}>Comece grátis. Escale quando precisar.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { name: "Gratuito", price: "R$ 0", features: ["3 prompts para começar", "Análise de imagem por IA", "Sem cartão de crédito"], cta: "Começar grátis", primary: false },
            { name: "Starter", price: "R$ 29", per: "/mês", features: ["30 prompts por mês", "Upload de imagem + análise IA", "Histórico completo", "Sem marca d'água"], cta: "Assinar Starter", primary: true, popular: true },
            { name: "Pro", price: "R$ 79", per: "/mês", features: ["100 prompts por mês", "Tudo do Starter", "Exportar em .txt", "Prompts favoritos"], cta: "Assinar Pro", primary: false },
          ].map((p) => (
            <div
              key={p.name}
              className="relative rounded-xl p-7 transition-all duration-300"
              style={{
                background: "#111",
                border: p.popular ? "1px solid #C9A84C" : "1px solid #1e1e1e",
              }}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-mono text-[9px] uppercase tracking-widest" style={{ background: "#C9A84C", color: "#000" }}>
                  Mais popular
                </span>
              )}
              <h3 className="font-display text-2xl font-semibold mb-1">{p.name}</h3>
              <div className="mb-5">
                <span className="font-display text-4xl font-semibold" style={{ color: "#C9A84C" }}>{p.price}</span>
                {p.per && <span className="font-mono text-xs" style={{ color: "#888" }}>{p.per}</span>}
              </div>
              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="font-mono text-xs flex items-start gap-2" style={{ color: "#fff" }}>
                    <span style={{ color: "#C9A84C" }}>✦</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToApp}
                className="w-full py-2.5 rounded-lg font-mono text-sm transition-colors"
                style={
                  p.primary
                    ? { background: "#C9A84C", color: "#000", fontWeight: 700 }
                    : { background: "transparent", color: "#fff", border: "1px solid #333" }
                }
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-8 text-center font-mono text-xs" style={{ borderTop: "1px solid #1e1e1e", color: "#888" }}>
          Prefere usar sem assinatura? →{" "}
          <a href="#" className="underline" style={{ color: "#C9A84C" }}>Créditos avulsos a partir de R$ 14,90</a>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <div className="rounded-2xl p-12 md:p-16 text-center" style={{ background: "#111", border: "1px solid #1e1e1e" }}>
          <h2 className="font-display text-3xl md:text-5xl font-semibold mb-4 leading-tight">
            Pronto para gerar seu<br />primeiro <em style={{ color: "#C9A84C" }}>prompt</em>?
          </h2>
          <p className="font-mono text-sm mb-8" style={{ color: "#888" }}>
            Junte-se a centenas de arquitetos que já usam PromptRender
          </p>
          <button
            onClick={goToApp}
            className="px-8 py-4 rounded-lg font-mono text-base font-bold inline-flex items-center gap-2 transition-transform active:scale-[0.97]"
            style={{ background: "#C9A84C", color: "#000" }}
          >
            Criar conta grátis <ArrowRight className="w-4 h-4" />
          </button>
          <p className="mt-5 font-mono text-[11px]" style={{ color: "#888" }}>
            Sem cartão de crédito • 3 prompts gratuitos • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-8" style={{ borderTop: "1px solid #1e1e1e" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-xs" style={{ color: "#888" }}>
            <div className="w-6 h-6 rounded gold-gradient flex items-center justify-center">
              <Box className="w-3 h-3 text-primary-foreground" />
            </div>
            © 2025 PromptRender
          </div>
          <div className="flex gap-5 font-mono text-xs" style={{ color: "#888" }}>
            <a href="#" className="hover:text-foreground">Termos de Uso</a>
            <a href="#" className="hover:text-foreground">Privacidade</a>
            <a href="#" className="hover:text-foreground">Contato</a>
          </div>
        </div>
      </footer>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSuccess={() => navigate("/app")} />
    </div>
  );
}
