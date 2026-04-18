-- Sync user_credits table with database structure
-- Add missing columns that exist in the database but not in the migration files

-- Add missing columns to user_credits table
ALTER TABLE public.user_credits 
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS bonus_credits INTEGER DEFAULT 0;

-- Add constraint for subscription plan values
ALTER TABLE public.user_credits
  DROP CONSTRAINT IF EXISTS user_credits_subscription_plan_check;

ALTER TABLE public.user_credits
  ADD CONSTRAINT user_credits_subscription_plan_check
  CHECK (subscription_plan IN ('free', 'starter', 'pro'));

-- Update existing records with default values
UPDATE public.user_credits SET 
  subscription_plan = COALESCE(subscription_plan, 'free'),
  bonus_credits = COALESCE(bonus_credits, 0)
WHERE subscription_plan IS NULL OR bonus_credits IS NULL;
