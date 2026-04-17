import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { PlanTier } from "@/config/planPermissions";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  credits: number | null;
  bonusCredits: number;
  currentPlan: PlanTier;
  refreshCredits: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [bonusCredits, setBonusCredits] = useState(0);
  const [currentPlan, setCurrentPlan] = useState<PlanTier>("free");

  const refreshCredits = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      setCredits(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("prompt_credits, avulso_credits, plan")
      .eq("user_id", u.id)
      .maybeSingle();

    const baseCredits = data?.prompt_credits ?? 0;
    const oneOffCredits = data?.avulso_credits ?? 0;

    setCredits(baseCredits + oneOffCredits);
    setBonusCredits(oneOffCredits);
    setCurrentPlan((data?.plan as PlanTier | null) ?? "free");
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => { refreshCredits(); }, 0);
      } else {
        setCredits(null);
        setBonusCredits(0);
        setCurrentPlan("free");
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) refreshCredits();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [refreshCredits]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, credits, bonusCredits, currentPlan, refreshCredits, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
