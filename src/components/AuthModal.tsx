import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    onSuccess?.();
    onClose();
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("✦ 5 créditos gratuitos adicionados à sua conta");
    onSuccess?.();
    onClose();
  };

  const handleGoogle = async () => {
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    
    setLoading(false);
    
    if (error) {
      console.error("Google OAuth error:", error);
      toast.error("Erro ao entrar com Google. Verifique a configuração do OAuth no Supabase.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-md border"
        style={{
          background: "#0f0f0f",
          borderColor: "#1e1e1e",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <DialogTitle className="font-display text-2xl">
          Entre no <span className="gold-text">PromptRender</span>
        </DialogTitle>
        <DialogDescription className="font-mono text-xs text-muted-foreground">
          Crie sua conta e ganhe 5 prompts gratuitos
        </DialogDescription>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin" className="font-mono text-xs">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="font-mono text-xs">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-3 mt-4">
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <Label className="font-mono text-xs text-muted-foreground">Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs text-muted-foreground">Senha</Label>
                <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
              </div>
              <Button type="submit" disabled={loading} className="w-full gold-gradient text-primary-foreground font-mono">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-3 mt-4">
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <Label className="font-mono text-xs text-muted-foreground">Nome</Label>
                <Input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs text-muted-foreground">Email</Label>
                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="font-mono text-xs text-muted-foreground">Senha</Label>
                <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
              </div>
              <Button type="submit" disabled={loading} className="w-full gold-gradient text-primary-foreground font-mono">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar conta grátis"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" style={{ borderColor: "#1e1e1e" }} />
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 font-mono text-[10px] text-muted-foreground" style={{ background: "#0f0f0f" }}>OU</span>
          </div>
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-md font-mono text-sm transition-colors hover:bg-secondary"
          style={{ background: "#111", border: "1px solid #333", color: "#fff" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar com Google
        </button>
      </DialogContent>
    </Dialog>
  );
}
