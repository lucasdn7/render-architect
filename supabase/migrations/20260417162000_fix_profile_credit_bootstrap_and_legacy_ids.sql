-- Garante que perfis legados (id = auth.uid) continuem funcionando com o app atual (user_id)
-- e evita usuários com 0 créditos por ausência de profile.

-- 1) Copiar id -> user_id quando user_id estiver nulo e id apontar para auth.users
UPDATE public.profiles p
SET user_id = p.id
WHERE p.user_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = p.id
  );

-- 2) Criar profile padrão para usuários autenticados sem linha em profiles
INSERT INTO public.profiles (
  user_id,
  display_name,
  email,
  plan,
  prompt_credits,
  avulso_credits,
  role,
  created_at,
  updated_at
)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  ) AS display_name,
  u.email,
  'free' AS plan,
  5 AS prompt_credits,
  0 AS avulso_credits,
  'user' AS role,
  now(),
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1
  FROM public.profiles p
  WHERE p.user_id = u.id
);

-- 3) Normaliza créditos nulos
UPDATE public.profiles
SET prompt_credits = COALESCE(prompt_credits, 5),
    avulso_credits = COALESCE(avulso_credits, 0),
    plan = COALESCE(plan, 'free'),
    updated_at = now()
WHERE prompt_credits IS NULL
   OR avulso_credits IS NULL
   OR plan IS NULL;

-- 4) Keep compat table user_credits sincronizada (somatório profile)
INSERT INTO public.user_credits (user_id, credits, total_used, bonus_credits, subscription_plan, updated_at)
SELECT
  p.user_id,
  GREATEST(0, COALESCE(p.prompt_credits, 0) + COALESCE(p.avulso_credits, 0)) AS credits,
  0,
  COALESCE(p.avulso_credits, 0),
  COALESCE(p.plan, 'free'),
  now()
FROM public.profiles p
WHERE p.user_id IS NOT NULL
ON CONFLICT (user_id)
DO UPDATE SET
  credits = EXCLUDED.credits,
  bonus_credits = EXCLUDED.bonus_credits,
  subscription_plan = EXCLUDED.subscription_plan,
  updated_at = now();
