import { useState, useEffect } from "react";
import ProfileLayout from "@/components/ProfileLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserSettings {
  fullName: string;
  email: string;
  emailProvider: 'google' | 'email';
  notifications: {
    lowCredits: boolean;
    updates: boolean;
    tips: boolean;
  };
}

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings>({
    fullName: '',
    email: '',
    emailProvider: 'email',
    notifications: {
      lowCredits: true,
      updates: false,
      tips: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasNumber: false
  });
  const [showCancelPlanDialog, setShowCancelPlanDialog] = useState(false);
  const [cancelingPlan, setCancelingPlan] = useState(false);

  useEffect(() => {
    loadUserSettings();
  }, []);

  useEffect(() => {
    // Validate password
    const newPassword = passwordData.newPassword;
    setPasswordValidation({
      minLength: newPassword.length >= 8,
      hasNumber: /\d/.test(newPassword)
    });
  }, [passwordData.newPassword]);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user signed up with Google
      const identities = user.identities;
      const isGoogleUser = identities?.some(id => id.provider === 'google');

      // Get user profile from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSettings({
        fullName: profile?.display_name || user.email?.split('@')[0] || '',
        email: user.email || '',
        emailProvider: isGoogleUser ? 'google' : 'email',
        notifications: {
          lowCredits: true,
          updates: false,
          tips: false
        }
      });
    } catch (error) {
      console.error('Error loading user settings:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const savePersonalInfo = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: settings.fullName,
          email: user.email,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Alterações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving personal info:', error);
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.error('As senhas não conferem');
        return;
      }

      if (!passwordValidation.minLength || !passwordValidation.hasNumber) {
        toast.error('A senha não atende aos requisitos mínimos');
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success('Senha atualizada com sucesso!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Erro ao atualizar senha');
    }
  };

  const updateNotifications = async (key: keyof UserSettings['notifications'], value: boolean) => {
    try {
      const newSettings = {
        ...settings,
        notifications: {
          ...settings.notifications,
          [key]: value
        }
      };
      setSettings(newSettings);

      // TODO: Save to database or user metadata
      toast.success('Preferências de notificação atualizadas');
    } catch (error) {
      toast.error('Erro ao atualizar notificações');
    }
  };

  const deleteAccount = async () => {
    try {
      if (deleteConfirmText !== 'EXCLUIR') {
        toast.error('Digite EXCLUIR para confirmar');
        return;
      }

      // TODO: Implement delete_user_account RPC function
      toast.info('Funcionalidade em desenvolvimento');
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Erro ao excluir conta');
    }
  };

  const cancelSubscription = async () => {
    try {
      setCancelingPlan(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Usuário não autenticado");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/cancel-subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Erro ao cancelar assinatura");

      toast.success("Assinatura cancelada com sucesso.");
      setShowCancelPlanDialog(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao cancelar assinatura");
    } finally {
      setCancelingPlan(false);
    }
  };

  if (loading) {
    return (
      <ProfileLayout title="Configurações" subtitle="Gerencie sua conta e preferências">
        <div className="space-y-8">
          {/* Skeleton Personal Info */}
          <div>
            <div className="h-4 w-32 rounded mb-4" style={{ background: "#1a1a1a" }} />
            <div className="p-6 rounded-xl border space-y-4" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <div className="h-3 w-24 rounded mb-2" style={{ background: "#1a1a1a" }} />
                  <div className="h-10 w-full rounded" style={{ background: "#0d0d0d" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  return (
    <ProfileLayout title="Configurações" subtitle="Gerencie sua conta e preferências">
      <div className="space-y-8">
        {/* Personal Information */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="font-mono text-xs font-medium" style={{ color: "#C9A84C" }}>
              DADOS PESSOAIS
            </div>
            <div className="flex-1 h-px" style={{ background: "#1e1e1e" }} />
          </div>
          
          <div className="p-7 rounded-xl border" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-18 h-18 rounded-full flex items-center justify-center font-mono text-xl font-medium"
                style={{ background: "#1e1e1e", border: "2px solid #C9A84C", color: "#C9A84C" }}>
                {settings.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <button className="font-mono text-xs" style={{ color: "#888888" }}>
                  Alterar foto (em breve)
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-muted-foreground mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={settings.fullName}
                  onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200"
                  style={{ 
                    background: "#0d0d0d", 
                    border: "1px solid #1e1e1e",
                    color: "#FFFFFF"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#C9A84C";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1e1e1e";
                  }}
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-muted-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={settings.email}
                    disabled={settings.emailProvider === 'google'}
                    className="w-full px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200 pr-10"
                    style={{ 
                      background: settings.emailProvider === 'google' ? "#0a0a0a" : "#0d0d0d", 
                      border: "1px solid #1e1e1e",
                      color: settings.emailProvider === 'google' ? "#444444" : "#FFFFFF",
                      opacity: settings.emailProvider === 'google' ? 0.5 : 1
                    }}
                  />
                  {settings.emailProvider === 'google' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg width="20" height="20" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    </div>
                  )}
                </div>
                {settings.emailProvider === 'google' && (
                  <div className="font-mono text-xs text-muted-foreground mt-1">
                    Email gerenciado pelo Google
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={savePersonalInfo}
              disabled={saving}
              className="px-6 py-3 rounded-lg font-mono text-sm font-bold transition-colors duration-200"
              style={{ background: "#C9A84C", color: "#000" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#b89440";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#C9A84C";
              }}
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* Security */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="font-mono text-xs font-medium" style={{ color: "#C9A84C" }}>
              SEGURANÇA
            </div>
            <div className="flex-1 h-px" style={{ background: "#1e1e1e" }} />
          </div>

          {settings.emailProvider === 'google' ? (
            <div className="p-4 rounded-lg border flex items-center gap-3" style={{ background: "#0d0d0d", borderColor: "#1e1e1e" }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div className="font-mono text-xs text-muted-foreground">
                Sua senha é gerenciada pelo Google. Acesse as configurações do Google para alterá-la.
              </div>
            </div>
          ) : (
            <div className="p-7 rounded-xl border space-y-4" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
              <div>
                <label className="block font-mono text-xs text-muted-foreground mb-2">
                  Senha atual
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200"
                  style={{ 
                    background: "#0d0d0d", 
                    border: "1px solid #1e1e1e",
                    color: "#FFFFFF"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#C9A84C";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1e1e1e";
                  }}
                />
              </div>

              <div>
                <label className="block font-mono text-xs text-muted-foreground mb-2">
                  Nova senha
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200"
                  style={{ 
                    background: "#0d0d0d", 
                    border: "1px solid #1e1e1e",
                    color: "#FFFFFF"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#C9A84C";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1e1e1e";
                  }}
                />
                <div className="mt-2 space-y-1">
                  <div className="font-mono text-xs flex items-center gap-2" style={{ color: passwordValidation.minLength ? "#4caf50" : "#888888" }}>
                    {passwordValidation.minLength ? '✓' : '✗'} Mínimo 8 caracteres
                  </div>
                  <div className="font-mono text-xs flex items-center gap-2" style={{ color: passwordValidation.hasNumber ? "#4caf50" : "#888888" }}>
                    {passwordValidation.hasNumber ? '✓' : '✗'} Pelo menos 1 número
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-muted-foreground mb-2">
                  Confirmar nova senha
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200"
                  style={{ 
                    background: "#0d0d0d", 
                    border: "1px solid #1e1e1e",
                    color: "#FFFFFF"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#C9A84C";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1e1e1e";
                  }}
                />
              </div>

              <button
                onClick={updatePassword}
                disabled={!passwordValidation.minLength || !passwordValidation.hasNumber || passwordData.newPassword !== passwordData.confirmPassword}
                className="px-6 py-3 rounded-lg font-mono text-sm transition-colors duration-200"
                style={{ 
                  background: "#C9A84C", 
                  color: "#000",
                  opacity: (!passwordValidation.minLength || !passwordValidation.hasNumber || passwordData.newPassword !== passwordData.confirmPassword) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (passwordValidation.minLength && passwordValidation.hasNumber && passwordData.newPassword === passwordData.confirmPassword) {
                    e.currentTarget.style.background = "#b89440";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#C9A84C";
                }}
              >
                Atualizar Senha
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="font-mono text-xs font-medium" style={{ color: "#C9A84C" }}>
              NOTIFICAÇÕES
            </div>
            <div className="flex-1 h-px" style={{ background: "#1e1e1e" }} />
          </div>

          <div className="p-7 rounded-xl border space-y-4" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
            {[
              { key: 'lowCredits' as const, label: 'Alertas de créditos baixos', desc: 'Avisa quando restar menos de 5 créditos' },
              { key: 'updates' as const, label: 'Novidades do PromptRender', desc: 'Atualizações e novos recursos' },
              { key: 'tips' as const, label: 'Dicas de uso', desc: 'Tutoriais e boas práticas' }
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm text-white">{label}</div>
                  <div className="font-mono text-xs text-muted-foreground">{desc}</div>
                </div>
                <button
                  onClick={() => updateNotifications(key, !settings.notifications[key])}
                  className="relative w-12 h-6 rounded-full transition-colors duration-200"
                  style={{ 
                    background: settings.notifications[key] ? "#C9A84C" : "#1e1e1e" 
                  }}
                >
                  <div 
                    className="absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200"
                    style={{ 
                      transform: settings.notifications[key] ? 'translateX(24px)' : 'translateX(4px)' 
                    }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="font-mono text-xs font-medium" style={{ color: "#C9A84C" }}>
              PLANO
            </div>
            <div className="flex-1 h-px" style={{ background: "#1e1e1e" }} />
          </div>

          <div className="p-7 rounded-xl border flex flex-wrap gap-3" style={{ background: "#111111", borderColor: "#1e1e1e" }}>
            <button
              onClick={() => navigate("/creditos")}
              className="px-5 py-2.5 rounded-lg font-mono text-sm font-bold transition-colors duration-200"
              style={{ background: "#C9A84C", color: "#000" }}
            >
              Alterar plano
            </button>
            <button
              onClick={() => setShowCancelPlanDialog(true)}
              className="px-5 py-2.5 rounded-lg font-mono text-sm transition-colors duration-200"
              style={{ border: "1px solid #c0392b", color: "#c0392b" }}
            >
              Cancelar plano
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div className="font-mono text-xs font-medium" style={{ color: "#c0392b" }}>
              ZONA DE PERIGO
            </div>
            <div className="flex-1 h-px" style={{ background: "#3a1010" }} />
          </div>

          <div className="p-6 rounded-xl border flex items-center justify-between" style={{ background: "#0f0808", borderColor: "#3a1010" }}>
            <div>
              <div className="font-mono text-sm text-white mb-1">Excluir minha conta</div>
              <div className="font-mono text-xs text-muted-foreground">
                Esta ação é permanente e não pode ser desfeita. Todos os seus dados e prompts serão deletados.
              </div>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-lg font-mono text-sm transition-colors duration-200"
              style={{ border: "1px solid #c0392b", color: "#c0392b" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#1f0a0a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Excluir conta
            </button>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
            <div className="w-full max-w-md p-8 rounded-xl border" style={{ background: "#111111", borderColor: "#3a1010" }}>
              <div className="font-display text-xl text-white mb-4">Tem certeza absoluta?</div>
              <div className="font-mono text-xs text-muted-foreground mb-6">
                Esta ação é permanente e não pode ser desfeita. Todos os seus dados, prompts e histórico serão permanentemente excluídos da nossa base de dados.
              </div>
              
              <div className="mb-6">
                <label className="block font-mono text-xs text-muted-foreground mb-2">
                  Digite EXCLUIR para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200"
                  style={{ 
                    background: "#0d0d0d", 
                    border: "1px solid #1e1e1e",
                    color: "#FFFFFF"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#c0392b";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1e1e1e";
                  }}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 px-4 py-3 rounded-lg font-mono text-sm transition-colors duration-200"
                  style={{ border: "1px solid #333", color: "#888" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#FFFFFF";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#888";
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirmText !== 'EXCLUIR'}
                  className="flex-1 px-4 py-3 rounded-lg font-mono text-sm font-bold transition-colors duration-200"
                  style={{ 
                    background: "#c0392b", 
                    color: "#FFFFFF",
                    opacity: deleteConfirmText === 'EXCLUIR' ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (deleteConfirmText === 'EXCLUIR') {
                      e.currentTarget.style.background = "#a02820";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#c0392b";
                  }}
                >
                  Excluir minha conta
                </button>
              </div>
            </div>
          </div>
        )}

        <Dialog open={showCancelPlanDialog} onOpenChange={setShowCancelPlanDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar plano</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar sua assinatura? Você perderá os benefícios do plano no próximo ciclo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                onClick={() => setShowCancelPlanDialog(false)}
                className="px-4 py-2 rounded-lg font-mono text-sm transition-colors duration-200"
                style={{ border: "1px solid #333", color: "#888" }}
              >
                Voltar
              </button>
              <button
                onClick={cancelSubscription}
                disabled={cancelingPlan}
                className="px-4 py-2 rounded-lg font-mono text-sm transition-colors duration-200"
                style={{ background: "#c0392b", color: "#fff", opacity: cancelingPlan ? 0.7 : 1 }}
              >
                {cancelingPlan ? "Cancelando..." : "Confirmar cancelamento"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProfileLayout>
  );
}
