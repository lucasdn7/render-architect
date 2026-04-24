import { useEffect, useState } from "react";
import { Clock, LogOut, User, CreditCard, History, Settings, ChevronDown, MessageSquare, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  credits?: number;
  onHistoryOpen?: () => void;
  showStepper?: boolean;
}

export default function Header({ credits, onHistoryOpen, showStepper = true }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadAdminAccess = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        return;
      }

      const { data } = await supabase
        .from("profiles" as never)
        .select("is_admin")
        .eq("user_id", user.id)
        .maybeSingle();

      setIsAdmin(Boolean((data as { is_admin?: boolean } | null)?.is_admin));
    };

    void loadAdminAccess();
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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

  return (
    <header className="sticky top-0 z-50 border-b" style={{ background: "#0a0a0a", borderColor: "#1e1e1e" }}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="font-display text-lg font-semibold leading-none" style={{ lineHeight: 1 }}>
                Prompt<span style={{ color: "#C9A84C" }}>Render</span>
              </h1>
              <p className="font-mono text-[10px] text-muted-foreground tracking-wider uppercase">
                Architectural AI Prompts
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showStepper && (
              <>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-xs"
                  style={{ background: "rgba(201,168,76,0.08)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <span className="sparkles-icon">{"\\u2728"}</span>
                  {credits ?? 0} créditos
                </div>
                <button
                  onClick={onHistoryOpen}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-xs text-muted-foreground transition-colors duration-200"
                  style={{ border: "1px solid #1e1e1e" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#FFFFFF";
                    e.currentTarget.style.borderColor = "#C9A84C";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#888888";
                    e.currentTarget.style.borderColor = "#1e1e1e";
                  }}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Histórico
                </button>
              </>
            )}
            
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200"
                style={{ border: "1px solid #333" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#C9A84C";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#333";
                }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-medium"
                  style={{ background: "#1e1e1e", border: "1px solid #333", color: "#C9A84C" }}>
                  {getUserInitials()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg shadow-2xl border"
                    style={{ 
                      background: "#111111", 
                      borderColor: "#1e1e1e",
                      borderRadius: "12px"
                    }}>
                    <div className="p-4 border-b" style={{ borderColor: "#1e1e1e" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-medium"
                          style={{ background: "#1e1e1e", border: "1px solid #333", color: "#C9A84C" }}>
                          {getUserInitials()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-white truncate">{getUserName()}</div>
                          <div className="font-mono text-xs text-muted-foreground truncate">{user?.email}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => {
                          navigate("/perfil");
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-200"
                        style={{ color: "#888888" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1a1a1a";
                          e.currentTarget.style.color = "#C9A84C";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#888888";
                        }}
                      >
                        <User className="w-4 h-4" />
                        <span className="font-mono text-sm">Meu Perfil</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate("/creditos");
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-200"
                        style={{ color: "#888888" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1a1a1a";
                          e.currentTarget.style.color = "#C9A84C";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#888888";
                        }}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="font-mono text-sm">Comprar Créditos</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate("/historico");
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-200"
                        style={{ color: "#888888" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1a1a1a";
                          e.currentTarget.style.color = "#C9A84C";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#888888";
                        }}
                      >
                        <History className="w-4 h-4" />
                        <span className="font-mono text-sm">Histórico</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          navigate("/sugestoes");
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-200"
                        style={{ color: "#888888" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1a1a1a";
                          e.currentTarget.style.color = "#C9A84C";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#888888";
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-mono text-sm">Sugestões</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            navigate("/admin");
                            setDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-200"
                          style={{ color: "#888888" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#1a1a1a";
                            e.currentTarget.style.color = "#C9A84C";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "#888888";
                          }}
                        >
                          <Shield className="w-4 h-4" />
                          <span className="font-mono text-sm">Admin</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          navigate("/configuracoes");
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-200"
                        style={{ color: "#888888" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1a1a1a";
                          e.currentTarget.style.color = "#C9A84C";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#888888";
                        }}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="font-mono text-sm">Configurações</span>
                      </button>
                    </div>
                    
                    <div className="p-2 border-t" style={{ borderColor: "#1e1e1e" }}>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-200"
                        style={{ color: "#888888" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#1a1a1a";
                          e.currentTarget.style.color = "#c0392b";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#888888";
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-mono text-sm">Sair</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
