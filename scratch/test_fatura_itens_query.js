import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function run() {
  // Test with 'faturas' relation
  const { data: dataPlural, error: errorPlural } = await supabase
    .from("fatura_itens")
    .select(`
      id,
      faturas (
        id
      )
    `)
    .limit(1);

  console.log("Plural relation 'faturas':", { success: !errorPlural, error: errorPlural?.message });

  // Test with 'fatura' relation
  const { data: dataSingular, error: errorSingular } = await supabase
    .from("fatura_itens")
    .select(`
      id,
      fatura (
        id
      )
    `)
    .limit(1);

  console.log("Singular relation 'fatura':", { success: !errorSingular, error: errorSingular?.message });
}

run();
