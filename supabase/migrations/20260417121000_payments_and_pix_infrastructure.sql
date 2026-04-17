-- Profiles: plan and credits source-of-truth
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS prompt_credits INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS avulso_credits INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'starter', 'pro'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'));

-- Backfill profiles from user_credits (compat)
UPDATE public.profiles p
SET prompt_credits = COALESCE(uc.credits, p.prompt_credits)
FROM public.user_credits uc
WHERE uc.user_id = p.user_id
  AND (p.prompt_credits IS NULL OR p.prompt_credits = 0);

-- PIX manual orders
CREATE TABLE IF NOT EXISTS public.pix_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('subscription', 'credits')),
  plan TEXT NULL CHECK (plan IN ('starter', 'pro')),
  credits_amount INTEGER NULL CHECK (credits_amount IN (10, 30, 100)),
  amount_brl NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ NULL,
  notes TEXT NULL
);

ALTER TABLE public.pix_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own pix orders" ON public.pix_orders;
CREATE POLICY "Users can view own pix orders"
  ON public.pix_orders FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own pix orders" ON public.pix_orders;
CREATE POLICY "Users can create own pix orders"
  ON public.pix_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- utility: plan monthly credits
CREATE OR REPLACE FUNCTION public.plan_monthly_credits(plan_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF plan_name = 'pro' THEN
    RETURN 100;
  ELSIF plan_name = 'starter' THEN
    RETURN 30;
  END IF;
  RETURN 5;
END;
$$;

-- credit consumption rule: avulso first (effective Pro), then plan credits
CREATE OR REPLACE FUNCTION public.consume_credit()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_row public.profiles%ROWTYPE;
  effective_plan TEXT;
  consumed_type TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT * INTO profile_row
  FROM public.profiles
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF profile_row.user_id IS NULL THEN
    RAISE EXCEPTION 'Perfil do usuário não encontrado';
  END IF;

  IF profile_row.avulso_credits > 0 THEN
    UPDATE public.profiles
    SET avulso_credits = avulso_credits - 1,
        updated_at = now()
    WHERE user_id = auth.uid();

    effective_plan := 'pro';
    consumed_type := 'avulso';
  ELSIF profile_row.prompt_credits > 0 THEN
    UPDATE public.profiles
    SET prompt_credits = prompt_credits - 1,
        updated_at = now()
    WHERE user_id = auth.uid();

    effective_plan := COALESCE(profile_row.plan, 'free');
    consumed_type := 'plan';
  ELSE
    RETURN jsonb_build_object(
      'consumed', false,
      'credit_type', null,
      'effective_plan', COALESCE(profile_row.plan, 'free')
    );
  END IF;

  -- keep legacy aggregate table updated for compatibility with older UI pieces
  UPDATE public.user_credits
  SET credits = GREATEST(0, (SELECT prompt_credits + avulso_credits FROM public.profiles WHERE user_id = auth.uid())),
      updated_at = now()
  WHERE user_id = auth.uid();

  RETURN jsonb_build_object(
    'consumed', true,
    'credit_type', consumed_type,
    'effective_plan', effective_plan
  );
END;
$$;
