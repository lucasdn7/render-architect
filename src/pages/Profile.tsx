import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, CreditCard, History, Settings, LogOut, ArrowRight, Sparkles, TrendingUp, Clock, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";

interface ProfileStats {
  totalPrompts: number;
  planType: "free" | "starter" | "pro";
  memberSince: string;
  planRenewal?: string;
  recentActivity: Array<{
    id: string;
    type: string;
    lighting: string;
    createdAt: string;
  }>;
}

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

  // Extract tab from URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/creditos")) setActiveTab("credits");
    else if (path.includes("/historico")) setActiveTab("history");
    else if (path.includes("/configuracoes")) setActiveTab("settings");
    else setActiveTab("overview");
  }, [location]);

  useEffect(() => {
    loadProfileData();
    loadCredits();
  }, []);

  const loadProfileData = async () => {
    // Mock data for now - replace with actual API calls
    setStats({
      totalPrompts: 12,
      planType: "starter",
      memberSince: "Abril 2025",
      planRenewal: "15 Mai 2025",
      recentActivity: [
        { id: "1", type: "Render Externo", lighting: "Entardecer", createdAt: "2 horas atrás" },
        { id: "2", type: "Render Interno", lighting: "Diurno", createdAt: "5 horas atrás" },
        { id: "3", type: "Planta Humanizada", lighting: "Diurno", createdAt: "1 dia atrás" },
      ]
    });
  };

  const loadCredits = async () => {
    // Mock data for now - replace with actual API call
    setCredits(3);
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    const parts = user.email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  const getUserName = () => {
    if (!user?.email) return "Usuário";
    const parts = user.email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
    }
    return user.email.split("@")[0];
  };

  const getPlanLabel = () => {
    switch (stats?.planType) {
      case "starter": return "Starter";
      case "pro": return "Pro";
      default: return "Gratuito";
    }
  };

  const getPlanColor = () => {
    switch (stats?.planType) {
      case "starter":
      case "pro": return { bg: "#1a1400", border: "#C9A84C", text: "#C9A84C" };
      default: return { bg: "#1a1a1a", border: "#444", text: "#888" };
    }
  };

  const renderSidebar = () => (
    <div className="w-60 p-6 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
      {/* User Info */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center font-mono text-lg font-medium"
          style={{ background: "#1e1e1e", border: "2px solid #C9A84C", color: "#C9A84C" }}>
          {getUserInitials()}
        </div>
        <div className="font-display text-xl text-white mb-1">{getUserName()}</div>
        <div className="font-mono text-xs text-muted-foreground">{user?.email}</div>
        <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-mono"
          style={{ 
            background: getPlanColor().bg, 
            border: `1px solid ${getPlanColor().border}`, 
            color: getPlanColor().text 
          }}>
          {"\\u2728"} {getPlanLabel()}
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 mb-8">
        <button
          onClick={() => { setActiveTab("overview"); navigate("/perfil"); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
            activeTab === "overview" ? "text-white" : "text-muted-foreground"
          }`}
          style={activeTab === "overview" ? { background: "#1a1a1a", borderLeft: "2px solid #C9A84C" } : {}}
          onMouseEnter={(e) => {
            if (activeTab !== "overview") {
              e.currentTarget.style.background = "#141414";
              e.currentTarget.style.color = "#FFFFFF";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "overview") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#888888";
            }
          }}
        >
          <User className="w-4 h-4" />
          <span className="font-mono text-sm">Visão Geral</span>
        </button>

        <button
          onClick={() => { setActiveTab("credits"); navigate("/perfil/creditos"); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
            activeTab === "credits" ? "text-white" : "text-muted-foreground"
          }`}
          style={activeTab === "credits" ? { background: "#1a1a1a", borderLeft: "2px solid #C9A84C" } : {}}
          onMouseEnter={(e) => {
            if (activeTab !== "credits") {
              e.currentTarget.style.background = "#141414";
              e.currentTarget.style.color = "#FFFFFF";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "credits") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#888888";
            }
          }}
        >
          <CreditCard className="w-4 h-4" />
          <span className="font-mono text-sm">Créditos & Plano</span>
        </button>

        <button
          onClick={() => { setActiveTab("history"); navigate("/perfil/historico"); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
            activeTab === "history" ? "text-white" : "text-muted-foreground"
          }`}
          style={activeTab === "history" ? { background: "#1a1a1a", borderLeft: "2px solid #C9A84C" } : {}}
          onMouseEnter={(e) => {
            if (activeTab !== "history") {
              e.currentTarget.style.background = "#141414";
              e.currentTarget.style.color = "#FFFFFF";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "history") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#888888";
            }
          }}
        >
          <History className="w-4 h-4" />
          <span className="font-mono text-sm">Histórico</span>
        </button>

        <button
          onClick={() => { setActiveTab("settings"); navigate("/perfil/configuracoes"); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
            activeTab === "settings" ? "text-white" : "text-muted-foreground"
          }`}
          style={activeTab === "settings" ? { background: "#1a1a1a", borderLeft: "2px solid #C9A84C" } : {}}
          onMouseEnter={(e) => {
            if (activeTab !== "settings") {
              e.currentTarget.style.background = "#141414";
              e.currentTarget.style.color = "#FFFFFF";
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== "settings") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#888888";
            }
          }}
        >
          <Settings className="w-4 h-4" />
          <span className="font-mono text-sm">Configurações</span>
        </button>
      </nav>

      {/* Logout */}
      <button
        onClick={() => supabase.auth.signOut()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200"
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
        <LogOut className="w-4 h-4" />
        Sair
      </button>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <div className="font-mono text-sm text-muted-foreground mb-2">Bem-vindo de volta,</div>
        <div className="font-display text-3xl text-white mb-2">{getUserName()}.</div>
        <div className="font-mono text-xs text-muted-foreground">Membro desde {stats?.memberSince}</div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Credits */}
        <div className="p-6 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
          <div className="font-display text-2xl mb-2" style={{ color: "#C9A84C" }}>
            {credits || 0}
          </div>
          <div className="font-mono text-xs text-muted-foreground mb-3">créditos restantes</div>
          <div className="w-full h-1 rounded-full mb-3" style={{ background: "#1e1e1e" }}>
            <div 
              className="h-1 rounded-full transition-all duration-300" 
              style={{ 
                width: `${Math.min((credits || 0) / 30 * 100, 100)}%`, 
                background: "#C9A84C" 
              }}
            />
          </div>
          <button className="font-mono text-xs" style={{ color: "#C9A84C" }}>
            + Comprar mais créditos
          </button>
        </div>

        {/* Prompts Generated */}
        <div className="p-6 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
          <div className="font-display text-2xl mb-2 text-white">
            {stats?.totalPrompts || 0}
          </div>
          <div className="font-mono text-xs text-muted-foreground">prompts gerados</div>
          <div className="font-mono text-xs text-muted-foreground mt-1">no total</div>
        </div>

        {/* Current Plan */}
        <div className="p-6 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
          <div className="font-display text-xl mb-2 text-white">
            {getPlanLabel()}
          </div>
          <div className="font-mono text-xs text-muted-foreground mb-1">plano atual</div>
          <div className="font-mono text-xs" style={{ color: "#C9A84C" }}>
            Renova em {stats?.planRenewal}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <div className="font-mono text-xs font-medium" style={{ color: "#C9A84C" }}>
            ATIVIDADE RECENTE
          </div>
          <div className="flex-1 h-px" style={{ background: "#1e1e1e" }} />
        </div>
        <div className="space-y-3">
          {stats?.recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 rounded-lg border flex items-center justify-between"
              style={{ background: "#111111", borderColor: "#1e1e1e" }}>
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "#1a1a1a" }}>
                  <div className="w-4 h-4" style={{ background: "#C9A84C", transform: "rotate(45deg)" }} />
                </div>
                <div>
                  <div className="font-mono text-sm text-white">
                    {activity.type} · {activity.lighting}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    Gerado {activity.createdAt}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4" style={{ color: "#C9A84C", opacity: 0.4 }} />
            </div>
          ))}
        </div>
        <button className="font-mono text-xs mt-4" style={{ color: "#C9A84C" }}>
          Ver histórico completo {"\\u2192"}
        </button>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => navigate("/")}
            className="p-6 rounded-xl border transition-colors duration-200 text-left"
            style={{ background: "#0f0f0f", borderColor: "#C9A84C" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1a1400";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0f0f0f";
            }}
          >
            <Plus className="w-6 h-6 mb-3" style={{ color: "#C9A84C" }} />
            <div className="font-display text-lg text-white mb-2">Gerar Prompt</div>
            <div className="font-mono text-xs text-muted-foreground">Começar novo render</div>
          </button>

          <button 
            onClick={() => { setActiveTab("credits"); navigate("/perfil/creditos"); }}
            className="p-6 rounded-xl border transition-colors duration-200 text-left"
            style={{ background: "#111111", borderColor: "#1e1e1e" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#C9A84C";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#1e1e1e";
            }}
          >
            <Sparkles className="w-6 h-6 mb-3" style={{ color: "#C9A84C" }} />
            <div className="font-display text-lg text-white mb-2">Comprar Créditos</div>
            <div className="font-mono text-xs text-muted-foreground">Créditos avulsos a partir de R$ 14,90</div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "credits":
        return <div className="text-white font-mono">Créditos & Plano - Em construção...</div>;
      case "history":
        return <div className="text-white font-mono">Histórico - Em construção...</div>;
      case "settings":
        return <div className="text-white font-mono">Configurações - Em construção...</div>;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      <Header credits={credits || 0} showStepper={false} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          {renderSidebar()}
          
          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
