# Configurar Variáveis de Ambiente no Supabase

## Problema
O erro 401 está acontecendo porque as variáveis de ambiente da Edge Function não estão configuradas no Supabase.

## Solução

### 1. Acessar o Dashboard do Supabase
1. Vá para https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione seu projeto: `thfcvybfeufndyfqzwmr`

### 2. Configurar Variáveis de Ambiente da Edge Function
1. No menu lateral, vá para **Edge Functions**
2. Clique na função **analyze-image**
3. Vá para a seção **Edge Function Secrets**
4. Adicione as seguintes variáveis de ambiente:

#### Opção 1: Usando CometAPI (Recomendado)
```
COMET_API_KEY=sua-chave-api-comet-aqui
COMET_MODEL=gpt-4o-mini
COMET_API_URL=https://api.cometapi.com
```

#### Opção 2: Usando OpenAI (Alternativa)
```
OPENAI_API_KEY=sk-sua-chave-api-openai-aqui
OPENAI_MODEL=gpt-4o-mini
```

### 3. Obter a Chave da API CometAPI
1. Faça login no site da CometAPI
2. Vá para a seção de API Keys
3. Copie sua chave de API
4. Substitua `sua-chave-api-comet-aqui` pela sua chave real
5. Verifique a URL correta da API na documentação da CometAPI

### 4. Deploy da Função
1. Após configurar as variáveis, faça o deploy da função:
   - Pelo dashboard: clique em **Deploy**
   - Ou por CLI: `supabase functions deploy analyze-image`

### 5. Testar
1. Volte para a aplicação
2. Tente analisar uma imagem novamente
3. O erro 401 deve desaparecer

## Verificação
Se tudo estiver correto, a resposta da API será um JSON com a análise da imagem em vez do erro 401.

## Troubleshooting
- Se ainda der erro, verifique se a chave da API OpenAI está correta
- Verifique se a função foi deployada com sucesso
- Verifique os logs da Edge Function no dashboard do Supabase
