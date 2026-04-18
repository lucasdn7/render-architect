-- Fix credit system - migrate to user_credits and update functions

-- 1. Updated consume_credit function to use user_credits table
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
  daily_limit INTEGER;
  daily_used INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Get current credits and plan
  SELECT credits, bonus_credits, COALESCE(subscription_plan, 'free')
  INTO current_credits, current_bonus_credits, current_plan
  FROM public.user_credits
  WHERE user_id = auth.uid()
  FOR UPDATE;

  IF current_credits IS NULL THEN
    RAISE EXCEPTION 'Créditos não encontrados para o usuário';
  END IF;

  -- Check daily limits
  SELECT COALESCE(prompts_per_day, 5)
  INTO daily_limit
  FROM public.plans
  WHERE id = current_plan;

  -- Get today's usage
  SELECT COALESCE(prompts_generated_today, 0)
  INTO daily_used
  FROM public.usage_today
  WHERE user_id = auth.uid() AND date = CURRENT_DATE;

  -- Check if daily limit reached (only for non-unlimited plans)
  IF daily_limit > 0 AND daily_used >= daily_limit THEN
    RETURN jsonb_build_object(
      'consumed', false,
      'error', 'Limite diário atingido',
      'daily_limit', daily_limit,
      'daily_used', daily_used,
      'credit_type', null,
      'effective_plan', current_plan
    );
  END IF;

  -- Consume bonus credits first
  IF current_bonus_credits > 0 THEN
    UPDATE public.user_credits
    SET bonus_credits = bonus_credits - 1,
        total_used = total_used + 1,
        updated_at = now()
    WHERE user_id = auth.uid();

    -- Update daily usage
    INSERT INTO public.usage_today (user_id, prompts_generated_today, date)
    VALUES (auth.uid(), 1, CURRENT_DATE)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      prompts_generated_today = usage_today.prompts_generated_today + 1;

    RETURN jsonb_build_object(
      'consumed', true,
      'credit_type', 'bonus',
      'effective_plan', current_plan,
      'daily_used', daily_used + 1,
      'daily_limit', daily_limit
    );
  END IF;

  -- Then consume regular credits
  IF current_credits > 0 THEN
    UPDATE public.user_credits
    SET credits = credits - 1,
        total_used = total_used + 1,
        updated_at = now()
    WHERE user_id = auth.uid();

    -- Update daily usage
    INSERT INTO public.usage_today (user_id, prompts_generated_today, date)
    VALUES (auth.uid(), 1, CURRENT_DATE)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      prompts_generated_today = usage_today.prompts_generated_today + 1;

    RETURN jsonb_build_object(
      'consumed', true,
      'credit_type', 'regular',
      'effective_plan', current_plan,
      'daily_used', daily_used + 1,
      'daily_limit', daily_limit
    );
  END IF;

  RETURN jsonb_build_object(
    'consumed', false,
    'error', 'Créditos insuficientes',
    'credit_type', null,
    'effective_plan', current_plan,
    'daily_used', daily_used,
    'daily_limit', daily_limit
  );
END;
$$;

-- 2. Update handle_new_user to work with user_credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name, email, plan, prompt_credits, avulso_credits, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'free',
    5,
    0,
    'user'
  );

  -- Create user credits
  INSERT INTO public.user_credits (user_id, credits, total_used, subscription_plan, bonus_credits)
  VALUES (NEW.id, 5, 0, 'free', 0);

  -- Initialize usage_today for new user
  INSERT INTO public.usage_today (user_id, prompts_generated_today, images_analyzed_today, tokens_used_today, date)
  VALUES (NEW.id, 0, 0, 0, CURRENT_DATE);

  RETURN NEW;
END;
$$;

-- 3. Add credits reset function
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Reset daily usage counters
  UPDATE public.usage_today
  SET prompts_generated_today = 0,
      images_analyzed_today = 0,
      tokens_used_today = 0
  WHERE date < CURRENT_DATE;
  
  -- Delete old usage records (keep last 30 days)
  DELETE FROM public.usage_today
  WHERE date < CURRENT_DATE - INTERVAL '30 days';
END;
$$;

-- 4. Create function to check user limits
CREATE OR REPLACE FUNCTION public.check_user_limits()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan TEXT;
  daily_limit INTEGER;
  daily_used INTEGER;
  credits_remaining INTEGER;
  bonus_remaining INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;

  -- Get user plan and credits
  SELECT COALESCE(uc.subscription_plan, 'free'), uc.credits, uc.bonus_credits
  INTO user_plan, credits_remaining, bonus_remaining
  FROM public.user_credits uc
  WHERE uc.user_id = auth.uid();

  -- Get daily limits
  SELECT COALESCE(p.prompts_per_day, 5)
  INTO daily_limit
  FROM public.plans p
  WHERE p.id = user_plan;

  -- Get today's usage
  SELECT COALESCE(ut.prompts_generated_today, 0)
  INTO daily_used
  FROM public.usage_today ut
  WHERE ut.user_id = auth.uid() AND ut.date = CURRENT_DATE;

  RETURN jsonb_build_object(
    'authenticated', true,
    'plan', user_plan,
    'credits_remaining', credits_remaining,
    'bonus_remaining', bonus_remaining,
    'total_remaining', credits_remaining + bonus_remaining,
    'daily_limit', daily_limit,
    'daily_used', daily_used,
    'daily_remaining', GREATEST(0, daily_limit - daily_used),
    'can_generate', (credits_remaining + bonus_remaining) > 0 AND (daily_limit <= 0 OR daily_used < daily_limit)
  );
END;
$$;
