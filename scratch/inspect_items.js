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

async function run() {
  const yId = '3f1e8167-64c6-4730-bc21-283d79a446db'; // Yonathan
  const eId = '5093c338-eb83-4442-8a58-69584e1f02fd'; // Eliza

  console.log('--- YONATHAN ITEMS ---');
  // Wait, standard join in postgrest
  const { data: yItemsJoin } = await supabase
    .from('fatura_itens')
    .select('*, faturas!inner(*)')
    .eq('faturas.paciente_id', yId);
  console.log(yItemsJoin);

  console.log('\n--- ELIZA ITEMS ---');
  const { data: eItemsJoin } = await supabase
    .from('fatura_itens')
    .select('*, faturas!inner(*)')
    .eq('faturas.paciente_id', eId);
  console.log(eItemsJoin);

  // Let's test fn_get_pricing for both
  // We need professional_id and service/specialty
  // For Yonathan: professional_id is '181bdc69-26c0-4a42-8ba7-d91107912fe9' (Fonoaudiologia)
  // For Eliza: professional_id is '7ab73ad3-cb74-4e3e-852e-fed665dc008d' (Fonoaudiologia)
  
  const { data: pPriceY } = await supabase.rpc('fn_get_pricing', {
    p_especialidade: 'Fonoaudiologia',
    p_paciente_id: yId,
    p_profissional_id: '181bdc69-26c0-4a42-8ba7-d91107912fe9',
    p_tipo_agendamento: 'sessao'
  });
  console.log('\nfn_get_pricing for Yonathan:', pPriceY);

  const { data: pPriceE } = await supabase.rpc('fn_get_pricing', {
    p_especialidade: 'Fonoaudiologia',
    p_paciente_id: eId,
    p_profissional_id: '7ab73ad3-cb74-4e3e-852e-fed665dc008d',
    p_tipo_agendamento: 'sessao'
  });
  console.log('fn_get_pricing for Eliza:', pPriceE);
}

run();
