import { supabase } from "@/integrations/supabase/client";

/**
 * Garante que o app tenha uma sessão Supabase válida.
 * Usa login anônimo para permitir RLS por usuário sem exigir cadastro.
 */
export async function ensureSupabaseSession(): Promise<void> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error("Não foi possível validar sessão com o Supabase.");
  }

  if (sessionData.session) {
    return;
  }

  const { error: anonymousError } = await supabase.auth.signInAnonymously();
  if (anonymousError) {
    throw new Error("Não foi possível iniciar sessão anônima no Supabase.");
  }
}
