# PromptRender

Aplicação React + Supabase para:
- analisar imagens arquitetônicas via Edge Function;
- gerar prompt final otimizado para IA;
- salvar histórico por usuário no Supabase.

## Integração Supabase (completa)

### 1) Criar projeto e obter chaves
No painel do Supabase, copie:
- `Project URL`
- `anon public key`

Crie o arquivo `.env`:

```bash
VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="SUA_ANON_KEY"
```

### 2) Habilitar login anônimo (obrigatório)
No Supabase Dashboard:
- **Authentication → Providers → Anonymous Sign-ins → Enable**.

A aplicação usa sessão anônima para aplicar RLS por usuário sem exigir cadastro.

### 3) Aplicar migrations
Com Supabase CLI configurado:

```bash
supabase db push
```

Isso cria/atualiza a tabela `prompt_history` e políticas RLS para isolar histórico por usuário.

### 4) Publicar Edge Functions
Funções usadas pelo front-end:
- `analyze-image`
- `generate-prompt`

Deploy:

```bash
supabase functions deploy analyze-image
supabase functions deploy generate-prompt
```

### 5) Configurar segredos da OpenAI nas Edge Functions
As duas funções leem `OPENAI_API_KEY` e opcionalmente `OPENAI_MODEL` (padrão: `gpt-4o-mini`).

```bash
supabase secrets set OPENAI_API_KEY="SUA_CHAVE_OPENAI"
supabase secrets set OPENAI_MODEL="gpt-4o-mini"
```

## Solução de problemas (db push)

### Erro: `relation "prompt_history" already exists`
Esse erro acontece quando a tabela já existe no banco remoto, mas a migration inicial ainda não foi marcada/aplicada no histórico do Supabase.

Passos recomendados:

```bash
# 1) marque a migration inicial como aplicada no histórico remoto
supabase migration repair --status applied 20260407000647_2be1acef-b991-4560-83de-c9c4676e387f

# 2) envie novamente as migrations pendentes
supabase db push
```

Se estiver usando `npx`:

```bash
npx supabase@latest migration repair --status applied 20260407000647_2be1acef-b991-4560-83de-c9c4676e387f
npx supabase@latest db push
```

## Execução local

```bash
npm install
npm run dev
```

## Scripts úteis

```bash
npm run build
npm run lint
npm run test
```
