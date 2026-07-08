import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env
const envContent = fs.readFileSync('.env', 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
    env[key] = val;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL || '', env.VITE_SUPABASE_PUBLISHABLE_KEY || '');

async function run() {
  // Find patient
  const { data: patients, error: pErr } = await supabase
    .from('pacientes')
    .select('*')
    .ilike('nome', '%júlia%');
  
  if (pErr) {
    console.error('Error fetching patients:', pErr);
    return;
  }

  console.log('Patients matching Júlia:');
  console.log(JSON.stringify(patients, null, 2));

  if (patients && patients.length > 0) {
    const julia = patients.find(p => p.nome.toLowerCase().includes('rica') || p.nome.toLowerCase().includes('julia'));
    if (julia) {
      // Find faturas
      const { data: faturas, error: fErr } = await supabase
        .from('faturas')
        .select('*')
        .eq('paciente_id', julia.id);
      
      console.log('\nFaturas for Júlia:');
      console.log(JSON.stringify(faturas, null, 2));

      // Find fatura items
      if (faturas && faturas.length > 0) {
        const fatIds = faturas.map(f => f.id);
        const { data: items, error: iErr } = await supabase
          .from('fatura_itens')
          .select('*')
          .in('fatura_id', fatIds);
        
        console.log('\nFatura items for Júlia:');
        console.log(JSON.stringify(items, null, 2));
      }
    }
  }
}

run();
