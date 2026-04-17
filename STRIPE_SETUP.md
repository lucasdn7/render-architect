# Stripe + PIX Setup (PromptRender)

## 1) Criar produtos e Prices no Stripe Dashboard

### Assinaturas (Recurring)
1. **PromptRender Starter**
   - Price: **R$ 29,00**
   - Currency: **BRL**
   - Recurrence: **mensal**
   - Metadata do produto/price: `{ plan: "starter" }`

2. **PromptRender Pro**
   - Price: **R$ 79,00**
   - Currency: **BRL**
   - Recurrence: **mensal**
   - Metadata do produto/price: `{ plan: "pro" }`

### Créditos avulsos (One-time)
1. **Créditos Avulsos - 10 prompts**
   - Price: **R$ 14,90**
   - Currency: **BRL**
   - One-time
   - Metadata: `{ credits: "10", type: "avulso" }`

2. **Créditos Avulsos - 30 prompts**
   - Price: **R$ 34,90**
   - Currency: **BRL**
   - One-time
   - Metadata: `{ credits: "30", type: "avulso" }`

3. **Créditos Avulsos - 100 prompts**
   - Price: **R$ 99,90**
   - Currency: **BRL**
   - One-time
   - Metadata: `{ credits: "100", type: "avulso" }`

Depois, copie os `price_...` e configure as variáveis de ambiente do frontend e dos secrets do Supabase.

---

## 2) Variáveis de ambiente

### Frontend (.env)
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_STRIPE_PRICE_STARTER`
- `VITE_STRIPE_PRICE_PRO`
- `VITE_STRIPE_PRICE_CREDITS_10`
- `VITE_STRIPE_PRICE_CREDITS_30`
- `VITE_STRIPE_PRICE_CREDITS_100`
- `VITE_PIX_KEY`

### Supabase Secrets (Edge Functions)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_CREDITS_10`
- `STRIPE_PRICE_CREDITS_30`
- `STRIPE_PRICE_CREDITS_100`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 3) Webhook Stripe

No Stripe Dashboard, crie um endpoint webhook para:

`https://<PROJECT_REF>.functions.supabase.co/stripe-webhook`

Eventos para escutar:
- `checkout.session.completed`
- `customer.subscription.deleted`
- `invoice.payment_failed`

Salve o **Signing secret** (`whsec_...`) em `STRIPE_WEBHOOK_SECRET` (Supabase secrets).

---

## 4) Fluxo PIX manual

A tabela `pix_orders` recebe pedidos em status `pending`.

Para confirmar um pedido PIX manualmente:
1. Faça login com usuário `admin` (`profiles.role = 'admin'`).
2. Chame a Edge Function `confirm-pix-order` com `{ orderId }`.
3. A função:
   - confirma pedido (`status = confirmed` + `confirmed_at`)
   - aplica plano (`starter`/`pro`) ou soma `avulso_credits` no perfil.

---

## 5) Deploy das funções

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy confirm-pix-order
```

E configure os secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=...
supabase secrets set STRIPE_WEBHOOK_SECRET=...
supabase secrets set STRIPE_PRICE_STARTER=...
supabase secrets set STRIPE_PRICE_PRO=...
supabase secrets set STRIPE_PRICE_CREDITS_10=...
supabase secrets set STRIPE_PRICE_CREDITS_30=...
supabase secrets set STRIPE_PRICE_CREDITS_100=...
```
