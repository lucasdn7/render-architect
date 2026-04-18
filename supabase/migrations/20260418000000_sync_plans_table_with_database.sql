-- Sync plans table with database structure
-- Add missing columns that exist in the database but not in the migration files

-- Add missing columns to plans table
ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS max_history_items INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS can_export_pdf BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_share_prompt BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_custom_prompts BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_batch BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_api BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_remove_watermark BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS support_level TEXT DEFAULT 'community';

-- Update existing plans with appropriate values based on their current configuration
UPDATE public.plans SET 
  max_history_items = CASE 
    WHEN id = 'free' THEN 10
    WHEN id = 'pro' THEN 500
    WHEN id = 'enterprise' THEN -1
    ELSE max_history_items
  END,
  can_export_pdf = CASE 
    WHEN id IN ('pro', 'enterprise') THEN true
    ELSE false
  END,
  can_share_prompt = CASE 
    WHEN id IN ('pro', 'enterprise') THEN true
    ELSE false
  END,
  can_use_custom_prompts = CASE 
    WHEN id = 'enterprise' THEN true
    ELSE false
  END,
  can_use_batch = CASE 
    WHEN id = 'enterprise' THEN true
    ELSE false
  END,
  can_use_api = CASE 
    WHEN id = 'enterprise' THEN true
    ELSE false
  END,
  can_remove_watermark = CASE 
    WHEN id IN ('pro', 'enterprise') THEN true
    ELSE false
  END,
  support_level = CASE 
    WHEN id = 'free' THEN 'community'
    WHEN id = 'pro' THEN 'email'
    WHEN id = 'enterprise' THEN 'priority'
    ELSE 'community'
  END
WHERE id IN ('free', 'pro', 'enterprise');
