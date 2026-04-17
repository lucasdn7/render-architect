-- Baseline das tabelas que hoje existem no Supabase Dashboard
-- Objetivo: reduzir drift entre ambiente remoto e repositório

-- ------------------------------
-- helper: updated_at trigger
-- ------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ------------------------------
-- plans
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly_brl NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_yearly_brl NUMERIC(10,2) NOT NULL DEFAULT 0,
  prompts_per_day INTEGER NOT NULL DEFAULT 0,
  image_analysis_per_day INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Todos podem ler planos" ON public.plans;
CREATE POLICY "Todos podem ler planos"
  ON public.plans FOR SELECT
  USING (true);

DROP TRIGGER IF EXISTS set_updated_at_plans ON public.plans;
CREATE TRIGGER set_updated_at_plans
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------
-- collections + collection_items
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  prompt_history_id UUID NULL REFERENCES public.prompt_history(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário acessa próprias coleções" ON public.collections;
CREATE POLICY "Usuário acessa próprias coleções"
  ON public.collections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário acessa itens de suas coleções" ON public.collection_items;
CREATE POLICY "Usuário acessa itens de suas coleções"
  ON public.collection_items FOR ALL
  USING (
    collection_id IN (
      SELECT c.id
      FROM public.collections c
      WHERE c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    collection_id IN (
      SELECT c.id
      FROM public.collections c
      WHERE c.user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS set_updated_at_collections ON public.collections;
CREATE TRIGGER set_updated_at_collections
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_collection_items ON public.collection_items;
CREATE TRIGGER set_updated_at_collection_items
  BEFORE UPDATE ON public.collection_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------
-- prompts e favoritos
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.custom_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_history_id UUID NULL REFERENCES public.prompt_history(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário acessa próprios prompts customizados" ON public.custom_prompts;
CREATE POLICY "Usuário acessa próprios prompts customizados"
  ON public.custom_prompts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário acessa próprios favoritos" ON public.favorites;
CREATE POLICY "Usuário acessa próprios favoritos"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_custom_prompts ON public.custom_prompts;
CREATE TRIGGER set_updated_at_custom_prompts
  BEFORE UPDATE ON public.custom_prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_favorites ON public.favorites;
CREATE TRIGGER set_updated_at_favorites
  BEFORE UPDATE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------
-- feedbacks
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário lê próprios feedbacks" ON public.feedbacks;
CREATE POLICY "Usuário lê próprios feedbacks"
  ON public.feedbacks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário insere próprio feedback" ON public.feedbacks;
CREATE POLICY "Usuário insere próprio feedback"
  ON public.feedbacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ------------------------------
-- gallery + likes
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_history_id UUID NULL REFERENCES public.prompt_history(id) ON DELETE SET NULL,
  title TEXT,
  image_url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.gallery(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (gallery_id, user_id)
);

ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Galeria pública visível a todos" ON public.gallery;
CREATE POLICY "Galeria pública visível a todos"
  ON public.gallery FOR SELECT
  USING (is_approved = true);

DROP POLICY IF EXISTS "Usuário gerencia próprias entradas na galeria" ON public.gallery;
CREATE POLICY "Usuário gerencia próprias entradas na galeria"
  ON public.gallery FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário acessa próprios likes da galeria" ON public.gallery_likes;
CREATE POLICY "Usuário acessa próprios likes da galeria"
  ON public.gallery_likes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_gallery ON public.gallery;
CREATE TRIGGER set_updated_at_gallery
  BEFORE UPDATE ON public.gallery
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------
-- sessions + notificações + settings
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.generation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário acessa próprias sessões" ON public.generation_sessions;
CREATE POLICY "Usuário acessa próprias sessões"
  ON public.generation_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário acessa próprias notificações" ON public.notifications;
CREATE POLICY "Usuário acessa próprias notificações"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário acessa próprias configurações" ON public.user_settings;
CREATE POLICY "Usuário acessa próprias configurações"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_generation_sessions ON public.generation_sessions;
CREATE TRIGGER set_updated_at_generation_sessions
  BEFORE UPDATE ON public.generation_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_notifications ON public.notifications;
CREATE TRIGGER set_updated_at_notifications
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_user_settings ON public.user_settings;
CREATE TRIGGER set_updated_at_user_settings
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------
-- templates + compartilhamento
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.prompt_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.prompt_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  template TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, version)
);

CREATE TABLE IF NOT EXISTS public.shared_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_history_id UUID NULL REFERENCES public.prompt_history(id) ON DELETE SET NULL,
  share_slug TEXT UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Todos podem ler templates ativos" ON public.prompt_templates;
CREATE POLICY "Todos podem ler templates ativos"
  ON public.prompt_templates FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins gerenciam templates" ON public.prompt_templates;
CREATE POLICY "Admins gerenciam templates"
  ON public.prompt_templates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins gerenciam versões de templates" ON public.prompt_template_versions;
CREATE POLICY "Admins gerenciam versões de templates"
  ON public.prompt_template_versions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Qualquer um lê prompt compartilhado ativo" ON public.shared_prompts;
CREATE POLICY "Qualquer um lê prompt compartilhado ativo"
  ON public.shared_prompts FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Usuário gerencia próprios compartilhamentos" ON public.shared_prompts;
CREATE POLICY "Usuário gerencia próprios compartilhamentos"
  ON public.shared_prompts FOR ALL
  USING (auth.uid() = shared_by)
  WITH CHECK (auth.uid() = shared_by);

DROP TRIGGER IF EXISTS set_updated_at_prompt_templates ON public.prompt_templates;
CREATE TRIGGER set_updated_at_prompt_templates
  BEFORE UPDATE ON public.prompt_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_shared_prompts ON public.shared_prompts;
CREATE TRIGGER set_updated_at_shared_prompts
  BEFORE UPDATE ON public.shared_prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------
-- analytics e uso
-- ------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  prompts_generated INTEGER NOT NULL DEFAULT 0,
  images_analyzed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day)
);

CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.usage_today (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  prompts_used INTEGER NOT NULL DEFAULT 0,
  images_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day)
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_today ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário acessa próprios analytics events" ON public.analytics_events;
CREATE POLICY "Usuário acessa próprios analytics events"
  ON public.analytics_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário acessa próprios analytics diários" ON public.daily_analytics;
CREATE POLICY "Usuário acessa próprios analytics diários"
  ON public.daily_analytics FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema insere logs de uso" ON public.usage_logs;
CREATE POLICY "Sistema insere logs de uso"
  ON public.usage_logs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Usuário lê próprio uso" ON public.usage_logs;
CREATE POLICY "Usuário lê próprio uso"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuário acessa próprio uso diário" ON public.usage_today;
CREATE POLICY "Usuário acessa próprio uso diário"
  ON public.usage_today FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_updated_at_daily_analytics ON public.daily_analytics;
CREATE TRIGGER set_updated_at_daily_analytics
  BEFORE UPDATE ON public.daily_analytics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_usage_today ON public.usage_today;
CREATE TRIGGER set_updated_at_usage_today
  BEFORE UPDATE ON public.usage_today
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------
-- Alinhamento final de RLS para profiles/prompt_history
-- ------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuário lê próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuário atualiza próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Histórico público visível a todos" ON public.prompt_history;
DROP POLICY IF EXISTS "Usuário acessa próprio histórico" ON public.prompt_history;
DROP POLICY IF EXISTS "Users can view their own prompt history" ON public.prompt_history;
DROP POLICY IF EXISTS "Users can insert their own prompt history" ON public.prompt_history;
DROP POLICY IF EXISTS "Users can delete their own prompt history" ON public.prompt_history;

CREATE POLICY "Users can view their own prompt history"
  ON public.prompt_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own prompt history"
  ON public.prompt_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own prompt history"
  ON public.prompt_history FOR DELETE
  USING (auth.uid() = user_id);
