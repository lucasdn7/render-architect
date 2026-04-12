const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deployFunction() {
  try {
    console.log('Fazendo deploy da função analyze-image...');
    
    // Ler o arquivo da função
    const fs = require('fs');
    const functionCode = fs.readFileSync('./supabase/functions/analyze-image/index.ts', 'utf8');
    
    // Deploy da função
    const { data, error } = await supabase.functions.invoke('analyze-image', {
      body: { test: true }
    });
    
    if (error) {
      console.error('Erro no deploy:', error);
    } else {
      console.log('Deploy realizado com sucesso!');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

deployFunction();
