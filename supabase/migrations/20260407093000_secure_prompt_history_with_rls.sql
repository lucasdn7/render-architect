-- Vincula o histórico a um usuário autenticado (inclui usuários anônimos do Supabase Auth)
ALTER TABLE public.prompt_history
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.prompt_history
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Remove políticas públicas anteriores
DROP POLICY IF EXISTS "Anyone can view prompt history" ON public.prompt_history;
DROP POLICY IF EXISTS "Anyone can insert prompt history" ON public.prompt_history;
DROP POLICY IF EXISTS "Anyone can delete prompt history" ON public.prompt_history;

-- Cada usuário vê apenas o próprio histórico
CREATE POLICY "Users can view their own prompt history"
  ON public.prompt_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Cada usuário insere apenas em seu próprio histórico
CREATE POLICY "Users can insert their own prompt history"
  ON public.prompt_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cada usuário remove apenas do próprio histórico
CREATE POLICY "Users can delete their own prompt history"
  ON public.prompt_history
  FOR DELETE
  USING (auth.uid() = user_id);
