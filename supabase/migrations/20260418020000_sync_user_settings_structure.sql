-- Sync user_settings table with database structure
-- The database has individual columns but the migration has a JSONB settings column

-- Add individual columns to user_settings table
ALTER TABLE public.user_settings 
  ADD COLUMN IF NOT EXISTS default_render_type TEXT,
  ADD COLUMN IF NOT EXISTS default_lighting TEXT,
  ADD COLUMN IF NOT EXISTS default_quality TEXT,
  ADD COLUMN IF NOT EXISTS default_camera TEXT,
  ADD COLUMN IF NOT EXISTS auto_copy_on_generate BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_prompt_structure BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS preferred_ai_tool TEXT,
  ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR';

-- Migrate existing settings from JSONB to individual columns
UPDATE public.user_settings SET 
  default_render_type = COALESCE((settings->>'default_render_type'), 'realistic'),
  default_lighting = COALESCE((settings->>'default_lighting'), 'studio'),
  default_quality = COALESCE((settings->>'default_quality'), 'high'),
  default_camera = COALESCE((settings->>'default_camera'), 'front'),
  auto_copy_on_generate = COALESCE((settings->>'auto_copy_on_generate')::boolean, false),
  show_prompt_structure = COALESCE((settings->>'show_prompt_structure')::boolean, true),
  preferred_ai_tool = COALESCE((settings->>'preferred_ai_tool'), 'openai'),
  email_notifications = COALESCE((settings->>'email_notifications')::boolean, true),
  marketing_emails = COALESCE((settings->>'marketing_emails')::boolean, false),
  theme = COALESCE((settings->>'theme'), 'system'),
  language = COALESCE((settings->>'language'), 'pt-BR')
WHERE settings != '{}'::jsonb;
