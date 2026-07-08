import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function check() {
  const { data: profs } = await supabase.from('profissionais').select('*');
  console.log("=== PROFESSIONALS ===");
  profs.forEach(p => {
    console.log(`ID: ${p.id}, Nome: ${p.nome}, Especialidade: ${p.especialidade}`);
  });

  const { data: servicos } = await supabase.from('servicos').select('*');
  console.log("\n=== SERVICES ===");
  servicos.forEach(s => {
    console.log(`ID: ${s.id}, Nome: ${s.nome}`);
  });
}

check();
