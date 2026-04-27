-- Migration: Adiciona retenção de 30 dias para prompt_history
-- Criado em: 2026-04-26

-- 1. Adiciona coluna expires_at para controle de retenção
ALTER TABLE public.prompt_history 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE 
  DEFAULT (now() + INTERVAL '30 days');

-- 2. Cria função para limpar registros antigos automaticamente
CREATE OR REPLACE FUNCTION public.delete_expired_prompt_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.prompt_history
  WHERE expires_at IS NOT NULL 
    AND expires_at < now();
END;
$$;

-- 3. Comentário explicativo
COMMENT ON FUNCTION public.delete_expired_prompt_history() IS 
  'Remove registros de prompt_history que expiraram (mais de 30 dias).';

-- 4. Trigger opcional: criar extensão pg_cron se disponível para execução automática
-- Nota: Em projetos Supabase, configure o cron job via dashboard ou use edge function

-- 5. Atualiza registros existentes sem expires_at para terem 30 dias a partir de created_at
UPDATE public.prompt_history
SET expires_at = created_at + INTERVAL '30 days'
WHERE expires_at IS NULL;
