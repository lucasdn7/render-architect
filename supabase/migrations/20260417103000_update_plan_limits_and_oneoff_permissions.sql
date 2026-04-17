-- Update plan metadata and free tier starting credits
ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT,
  ADD COLUMN IF NOT EXISTS bonus_credits INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.user_credits
  ALTER COLUMN credits SET DEFAULT 5;

UPDATE public.user_credits
SET subscription_plan = COALESCE(subscription_plan, 'free');

UPDATE public.user_credits
SET credits = GREATEST(credits, 5)
WHERE subscription_plan = 'free';

ALTER TABLE public.user_credits
  DROP CONSTRAINT IF EXISTS user_credits_subscription_plan_check;

ALTER TABLE public.user_credits
  ADD CONSTRAINT user_credits_subscription_plan_check
  CHECK (subscription_plan IN ('free', 'starter', 'pro'));

-- Ensure new users start with 5 free prompts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );

  INSERT INTO public.user_credits (user_id, credits, bonus_credits, subscription_plan)
  VALUES (NEW.id, 5, 0, 'free');

  RETURN NEW;
END;
$$;

-- Consume credit with one-off credits granting Pro-equivalent capabilities
CREATE OR REPLACE FUNCTION public.consume_credit()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_credits INTEGER;
  current_bonus_credits INTEGER;
  current_plan TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT credits, bonus_credits, COALESCE(subscription_plan, 'free')
  INTO current_credits, current_bonus_credits, current_plan
  FROM public.user_credits
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF current_bonus_credits > 0 THEN
    UPDATE public.user_credits
    SET bonus_credits = bonus_credits - 1,
        total_used = total_used + 1,
        updated_at = now()
    WHERE user_id = auth.uid();

    RETURN jsonb_build_object(
      'consumed', true,
      'credit_type', 'one_off',
      'effective_plan', 'pro'
    );
  END IF;

  IF current_credits > 0 THEN
    UPDATE public.user_credits
    SET credits = credits - 1,
        total_used = total_used + 1,
        updated_at = now()
    WHERE user_id = auth.uid();

    RETURN jsonb_build_object(
      'consumed', true,
      'credit_type', 'plan',
      'effective_plan', current_plan
    );
  END IF;

  RETURN jsonb_build_object(
    'consumed', false,
    'credit_type', null,
    'effective_plan', current_plan
  );
END;
$$;
