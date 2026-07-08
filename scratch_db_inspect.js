import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function inspect() {
  console.log("=== SERVICOS ===");
  const { data: servicos, error: sErr } = await supabase.from('servicos').select('id, nome, ativo');
  if (sErr) console.error("Error fetching services:", sErr);
  else console.log(servicos);

  console.log("\n=== PACIENTES COM APOIO / AP ===");
  const { data: pacientes, error: pErr } = await supabase.from('pacientes').select('id, nome, cids_secundarios, valor_mensal');
  if (pErr) console.error("Error fetching patients:", pErr);
  else {
    const filtered = pacientes.filter(p => 
      Array.isArray(p.cids_secundarios) && 
      p.cids_secundarios.some(s => s.toLowerCase() === 'apoio' || s.toLowerCase() === 'ap')
    );
    console.log(filtered);
  }
}

inspect();
