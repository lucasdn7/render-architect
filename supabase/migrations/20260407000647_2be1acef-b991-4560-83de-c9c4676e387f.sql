CREATE TABLE IF NOT EXISTS public.prompt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt TEXT NOT NULL,
  image_preview TEXT,
  render_config JSONB DEFAULT '{}'::jsonb,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_history ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for now)
DROP POLICY IF EXISTS "Anyone can view prompt history" ON public.prompt_history;
CREATE POLICY "Anyone can view prompt history"
  ON public.prompt_history FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert prompt history" ON public.prompt_history;
CREATE POLICY "Anyone can insert prompt history"
  ON public.prompt_history FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete prompt history" ON public.prompt_history;
CREATE POLICY "Anyone can delete prompt history"
  ON public.prompt_history FOR DELETE
  USING (true);
