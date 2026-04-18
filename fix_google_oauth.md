# Como Configurar Login Google no Supabase

## Problema Identificado
O login com Google está indo para página 404 porque o provedor OAuth não está configurado no Supabase.

## Solução Manual (Dashboard Supabase)

### 1. Acessar Dashboard Supabase
- Vá para: https://supabase.com/dashboard/project/iurzvjtfjhouowdqujbf
- Faça login com sua conta

### 2. Configurar Autenticação
- Vá para: **Authentication** no menu lateral
- Clique em **Providers**
- Ative o provedor **Google**

### 3. Configurar Google OAuth
- **Client ID**: Adicionar o Client ID do Google OAuth
- **Client Secret**: Adicionar o Client Secret do Google OAuth
- **Authorized Redirect URIs**: Adicionar as URLs:
  - `http://localhost:8080`
  - `https://localhost:8080`
  - `https://iurzvjtfjhouowdqujbf.supabase.co`
  - `https://render-architect.vercel.app`

### 4. Salvar Configuração
- Clique em **Save**
- Aguarde a configuração ser aplicada

## Testar Login Google
Após configurar:
1. Abra o aplicativo em `http://localhost:8080`
2. Clique em "Continuar com Google"
3. Faça login com sua conta Google
4. Deve ser redirecionado para `/app`

## Se Não Tiver Acesso ao Dashboard
Você precisará:
1. Obter as credenciais OAuth do Google Console
2. Pedir ao dono do projeto para configurar
3. Ou usar uma conta com permissões de administrador

## URLs de Redirect Necessárias
- **Desenvolvimento**: `http://localhost:8080`
- **Produção**: `https://render-architect.vercel.app`
- **Callback Supabase**: `https://iurzvjtfjhouowdqujbf.supabase.co/auth/v1/callback`
