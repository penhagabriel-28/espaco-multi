import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
    env[key] = val;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL || '', env.VITE_SUPABASE_PUBLISHABLE_KEY || '');

async function verify() {
  console.log('--- VERIFYING GENERATED AP-INVOICES (JULY 2026) ---');
  
  const { data: faturas, error } = await supabase
    .from('faturas')
    .select('id, paciente_id, competencia, valor, status, profissional_id, especialidade')
    .eq('especialidade', 'Apoio')
    .eq('competencia', '2026-07-01');

  if (error) {
    console.error('Error fetching faturas:', error);
    return;
  }

  const { data: patients } = await supabase.from('pacientes').select('id, nome');
  const { data: profs } = await supabase.from('profissionais').select('id, nome');

  const patientMap = new Map(patients?.map(p => [p.id, p.nome]));
  const profMap = new Map(profs?.map(p => [p.id, p.nome]));

  console.log(`Found ${faturas.length} Apoio invoices for July 2026:`);
  for (const f of faturas) {
    const pName = patientMap.get(f.paciente_id) || 'Unknown';
    const profName = profMap.get(f.profissional_id) || 'NONE';
    console.log(`- Patient: "${pName}" | Prof: "${profName}" | Value: R$ ${f.valor} | Status: ${f.status}`);
  }
}

verify();
