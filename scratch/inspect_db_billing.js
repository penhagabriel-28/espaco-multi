import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function run() {
  const { data: faturas, error } = await supabase
    .from('faturas')
    .select('*')
    .order('competencia', { ascending: false });

  if (error) {
    console.error("Error fetching faturas:", error);
    return;
  }

  console.log(`Total faturas in DB: ${faturas.length}`);
  if (faturas.length > 0) {
    console.log("Sample faturas:");
    faturas.slice(0, 10).forEach(f => {
      console.log(`- ID: ${f.id}, Paciente ID: ${f.paciente_id}, Competencia: ${f.competencia}, Valor: ${f.valor}, Status: ${f.status}`);
    });
  }

  const { data: pacientes } = await supabase.from('pacientes').select('id, nome, status');
  console.log(`\nTotal patients: ${pacientes?.length}`);
  console.log("Active patients sample:");
  pacientes?.filter(p => p.status === 'ativo').slice(0, 10).forEach(p => {
    console.log(`- ID: ${p.id}, Nome: ${p.nome}`);
  });
}

run();
