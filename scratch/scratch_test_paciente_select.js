import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testSelect() {
  const { data, error } = await supabase
    .from('pacientes')
    .select('id, nome, valor_mensal, cids_secundarios, apoio_frequencia, apoio_valor_personalizado')
    .order('nome');

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log(`Query succeeded! Returned ${data.length} rows.`);
    console.log("Sample patient:", data.find(p => p.cids_secundarios?.includes('Apoio')));
  }
}

testSelect();
