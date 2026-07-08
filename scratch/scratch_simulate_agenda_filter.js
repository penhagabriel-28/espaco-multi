import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testFilter() {
  const { data: ags = [] } = await supabase
    .from('agendamentos')
    .select('*, pacientes(nome)')
    .limit(10);

  const { data: pacientes = [] } = await supabase
    .from('pacientes')
    .select('id, nome')
    .limit(10);

  console.log("=== SAMPLE AGENDAMENTOS ===");
  ags.forEach(a => {
    console.log(`ID: ${a.id}, Paciente ID: ${a.paciente_id}, Paciente Nome: ${a.pacientes?.nome}`);
  });

  console.log("\n=== SAMPLE PACIENTES ===");
  pacientes.forEach(p => {
    console.log(`ID: ${p.id}, Nome: ${p.nome}`);
  });

  if (ags.length > 0 && pacientes.length > 0) {
    const selectedPacs = [ags[0].paciente_id];
    console.log(`\nSimulating filter with selectedPacs:`, selectedPacs);
    const filtered = ags.filter(a => selectedPacs.includes(a.paciente_id));
    console.log(`Filtered ags count: ${filtered.length} (expected >0)`);
  }
}

testFilter();
