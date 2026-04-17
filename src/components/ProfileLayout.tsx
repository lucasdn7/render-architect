import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { User, CreditCard, History, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

interface ProfileLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function ProfileLayout({ children, title, subtitle }: ProfileLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/creditos")) return "credits";
    if (path.includes("/historico")) return "history";
    if (path.includes("/configuracoes")) return "settings";
    return "profile";
  };

  const handleSignOut = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      <Header showStepper={false} />
      
      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-60 flex-shrink-0">
            <div className="p-6 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
              {/* User Info */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center font-mono text-sm font-medium"
                  style={{ background: "#1e1e1e", border: "2px solid #C9A84C", color: "#C9A84C" }}>
                  {getUserInitials()}
                </div>
                <div className="font-display text-base text-white mb-1">{getUserName()}</div>
                <div className="font-mono text-xs text-muted-foreground">{user?.email}</div>
                <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-mono"
                  style={{ background: "#1a1400", border: "1px solid #C9A84C", color: "#C9A84C" }}>
                  {"\\u2728"} Plano Starter
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1 mb-8">
                <button
                  onClick={() => navigate("/perfil")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    getActiveTab() === "profile" ? "text-white" : "text-muted-foreground"
                  }`}
                  style={getActiveTab() === "profile" ? { background: "#1a1a1a", borderLeft: "2px solid #C9A84C" } : {}}
                  onMouseEnter={(e) => {
                    if (getActiveTab() !== "profile") {
                      e.currentTarget.style.background = "#141414";
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getActiveTab() !== "profile") {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#888888";
                    }
                  }}
                >
                  <User className="w-4 h-4" />
                  <span className="font-mono text-sm">Meu Perfil</span>
                </button>

                <button
                  onClick={() => navigate("/creditos")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    getActiveTab() === "credits" ? "text-white" : "text-muted-foreground"
                  }`}
                  style={getActiveTab() === "credits" ? { background: "#1a1a1a", borderLeft: "2px solid #C9A84C" } : {}}
                  onMouseEnter={(e) => {
                    if (getActiveTab() !== "credits") {
                      e.currentTarget.style.background = "#141414";
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getActiveTab() !== "credits") {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#888888";
                    }
                  }}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="font-mono text-sm">Comprar Créditos</span>
                </button>

                <button
                  onClick={() => navigate("/historico")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    getActiveTab() === "history" ? "text-white" : "text-muted-foreground"
                  }`}
                  style={getActiveTab() === "history" ? { background: "#1a1a1a", borderLeft: "2px solid #C9A84C" } : {}}
                  onMouseEnter={(e) => {
                    if (getActiveTab() !== "history") {
                      e.currentTarget.style.background = "#141414";
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getActiveTab() !== "history") {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#888888";
                    }
                  }}
                >
                  <History className="w-4 h-4" />
                  <span className="font-mono text-sm">Histórico</span>
                </button>

                <button
                  onClick={() => navigate("/configuracoes")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    getActiveTab() === "settings" ? "text-white" : "text-muted-foreground"
                  }`}
                  style={getActiveTab() === "settings" ? { background: "#1a1a1a", borderLeft: "2px solid #C9A84C" } : {}}
                  onMouseEnter={(e) => {
                    if (getActiveTab() !== "settings") {
                      e.currentTarget.style.background = "#141414";
                      e.currentTarget.style.color = "#FFFFFF";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (getActiveTab() !== "settings") {
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
                onClick={handleSignOut}
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
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {title && (
              <div className="mb-8">
                <h1 className="font-display text-3xl text-white mb-2">{title}</h1>
                {subtitle && <p className="font-mono text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
