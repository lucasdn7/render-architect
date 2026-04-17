import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus, Sparkles, TrendingUp, Clock } from "lucide-react";
import ProfileLayout from "@/components/ProfileLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileStats {
  totalPrompts: number;
  memberSince: string;
  planType: "free" | "starter" | "pro";
  planRenewal?: string;
  credits: number;
  maxCredits: number;
  recentPrompts: Array<{
    id: string;
    type: string;
    lighting: string;
    environments: string[];
    surroundings: string[];
    created_at: string;
    prompt: string;
  }>;
}

export default function ProfileHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      // Get user profile data
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's prompts from prompt_history table
      const { data: prompts, error } = await supabase
        .from('prompt_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      // Get user credits
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('user_id', user.id)
        .single();

      const credits = creditsData?.credits || 3;
      const maxCredits = 30; // Replace with plan-based max

      // Calculate member since date
      const memberSince = new Date(user.created_at).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
      });

      setStats({
        totalPrompts: prompts?.length || 0,
        memberSince,
        planType: 'starter', // Replace with actual plan from user metadata
        planRenewal: '15/05/2025', // Replace with actual renewal date
        credits,
        maxCredits,
        recentPrompts: prompts?.map(p => {
          const config = typeof p.render_config === 'object' ? p.render_config as any : {};
          return {
            id: p.id,
            type: config?.render || 'Render Externo',
            lighting: config?.lighting || 'Diurno',
            environments: config?.environments || [],
            surroundings: config?.surroundings || [],
            created_at: p.created_at,
            prompt: p.prompt || ''
          };
        }) || []
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Erro ao carregar dados do perfil');
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'agora';
    if (diffInHours < 24) return `há ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `há ${diffInDays}d`;
  };

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success('Prompt copiado!');
    } catch (error) {
      toast.error('Erro ao copiar prompt');
    }
  };

  const regeneratePrompt = (promptData: any) => {
    // Store the configuration in sessionStorage for pre-filling
    sessionStorage.setItem('regenerateConfig', JSON.stringify(promptData));
    navigate('/');
  };

  if (loading) {
    return (
      <ProfileLayout title="Meu Perfil">
        <div className="space-y-8">
          {/* Skeleton Welcome */}
          <div className="space-y-2">
            <div className="h-4 w-32 rounded" style={{ background: "#1a1a1a" }} />
            <div className="h-8 w-48 rounded" style={{ background: "#1a1a1a" }} />
          </div>
          
          {/* Skeleton Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
                <div className="h-8 w-16 rounded mb-2" style={{ background: "#1a1a1a" }} />
                <div className="h-3 w-24 rounded mb-3" style={{ background: "#1a1a1a" }} />
                <div className="h-1 w-full rounded" style={{ background: "#1a1a1a" }} />
              </div>
            ))}
          </div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout title="Meu Perfil">
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <div className="font-mono text-sm text-muted-foreground mb-2">Bem-vindo de volta,</div>
          <div className="font-display text-3xl text-white mb-2 italic">
            {stats?.memberSince ? 'Usuário.' : 'Visitante.'}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            Membro desde {stats?.memberSince || 'hoje'}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {/* Credits */}
          <div className="p-6 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
            <div className="font-display text-2xl mb-2" style={{ color: "#C9A84C" }}>
              {stats?.credits || 0}
            </div>
            <div className="font-mono text-xs text-muted-foreground mb-3">créditos disponíveis</div>
            <div className="w-full h-1 rounded-full mb-3" style={{ background: "#1e1e1e" }}>
              <div 
                className="h-1 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${Math.min(((stats?.credits || 0) / (stats?.maxCredits || 30)) * 100, 100)}%`, 
                  background: "#C9A84C" 
                }}
              />
            </div>
            <button 
              onClick={() => navigate('/creditos')}
              className="font-mono text-xs hover:opacity-80 transition-opacity"
              style={{ color: "#C9A84C" }}
            >
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
              {stats?.planType === 'starter' ? 'Starter' : stats?.planType === 'pro' ? 'Pro' : 'Gratuito'}
            </div>
            <div className="font-mono text-xs text-muted-foreground mb-1">plano atual</div>
            {stats?.planRenewal && stats.planType !== 'free' && (
              <div className="font-mono text-xs" style={{ color: "#C9A84C" }}>
                Renova em {stats.planRenewal}
              </div>
            )}
            {stats?.planType === 'free' && (
              <button 
                onClick={() => navigate('/creditos')}
                className="font-mono text-xs hover:opacity-80 transition-opacity"
                style={{ color: "#C9A84C" }}
              >
                Fazer upgrade →
              </button>
            )}
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
          
          {stats?.recentPrompts && stats.recentPrompts.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPrompts.map((prompt) => (
                <div key={prompt.id} className="p-4 rounded-lg border flex items-center justify-between transition-all duration-200 hover:border-opacity-100"
                  style={{ background: "#111111", borderColor: "#1e1e1e", opacity: 0.8 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.borderColor = "#2a2a2a";
                    e.currentTarget.style.background = "#141414";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.8";
                    e.currentTarget.style.borderColor = "#1e1e1e";
                    e.currentTarget.style.background = "#111111";
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: "#1a1a1a" }}>
                      <div className="w-4 h-4" style={{ background: "#C9A84C", transform: "rotate(45deg)" }} />
                    </div>
                    <div>
                      <div className="font-mono text-sm text-white">
                        {prompt.type} · {prompt.lighting}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {prompt.environments.slice(0, 2).map(env => env).join(' · ')}
                        {prompt.surroundings.length > 0 && ` · ${prompt.surroundings[0]}`}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        Gerado {getTimeAgo(prompt.created_at)}
                      </div>
                    </div>
                  </div>
                  <ArrowRight 
                    className="w-4 h-4 cursor-pointer" 
                    style={{ color: "#C9A84C", opacity: 0.4 }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = "0.4"}
                    onClick={() => regeneratePrompt(prompt)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg flex items-center justify-center" style={{ background: "#1a1a1a" }}>
                <div className="w-8 h-8" style={{ background: "#C9A84C", transform: "rotate(45deg)" }} />
              </div>
              <div className="font-mono text-sm text-muted-foreground mb-4">Nenhum prompt gerado ainda</div>
              <button 
                onClick={() => navigate('/')}
                className="px-4 py-2 rounded-lg font-mono text-sm transition-colors duration-200"
                style={{ border: "1px solid #C9A84C", color: "#C9A84C" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#1a1400";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Gerar meu primeiro prompt →
              </button>
            </div>
          )}
          
          {stats?.recentPrompts && stats.recentPrompts.length > 0 && (
            <button 
              onClick={() => navigate('/historico')}
              className="font-mono text-xs mt-4 hover:opacity-80 transition-opacity"
              style={{ color: "#C9A84C" }}
            >
              Ver histórico completo →
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-6 rounded-xl border transition-all duration-200 text-left"
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
              <div className="font-mono text-xs text-muted-foreground">Começar do zero</div>
            </button>

            <button 
              onClick={() => navigate('/creditos')}
              className="p-6 rounded-xl border transition-all duration-200 text-left"
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
              <div className="font-mono text-xs text-muted-foreground">Pacotes a partir de R$ 14,90</div>
            </button>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
}
