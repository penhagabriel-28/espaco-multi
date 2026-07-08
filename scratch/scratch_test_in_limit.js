import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testIn() {
  const { data: faturaItens } = await supabase
    .from('fatura_itens')
    .select('agendamento_id');

  const ids = Array.from(new Set(faturaItens.map(i => i.agendamento_id).filter(Boolean)));
  console.log(`Testing query with ${ids.length} IDs...`);

  const { data, error } = await supabase
    .from('agendamentos')
    .select('id, profissional_id')
    .in('id', ids);

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log(`Query succeeded! Returned ${data.length} rows.`);
  }
}

testIn();
