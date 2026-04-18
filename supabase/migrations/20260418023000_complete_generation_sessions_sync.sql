-- Complete sync for generation_sessions table with database structure
-- Add remaining columns that exist in the database but not in previous migrations

-- Add missing columns to generation_sessions table
ALTER TABLE public.generation_sessions 
  ADD COLUMN IF NOT EXISTS analysis_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS selected_render_type TEXT,
  ADD COLUMN IF NOT EXISTS selected_lighting TEXT,
  ADD COLUMN IF NOT EXISTS selected_elements TEXT[],
  ADD COLUMN IF NOT EXISTS selected_quality TEXT,
  ADD COLUMN IF NOT EXISTS selected_camera TEXT,
  ADD COLUMN IF NOT EXISTS humanization_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS add_people BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS people_description TEXT,
  ADD COLUMN IF NOT EXISTS add_animals BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS animal_description TEXT,
  ADD COLUMN IF NOT EXISTS humanization_text TEXT,
  ADD COLUMN IF NOT EXISTS final_prompt TEXT,
  ADD COLUMN IF NOT EXISTS prompt_word_count INTEGER,
  ADD COLUMN IF NOT EXISTS prompt_model TEXT,
  ADD COLUMN IF NOT EXISTS prompt_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS total_api_calls INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_tokens_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS was_copied BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS was_edited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS was_favorited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS was_shared BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS copy_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
