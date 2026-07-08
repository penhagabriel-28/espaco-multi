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
  console.log('Fetching patients...');
  const { data: patients } = await supabase.from('pacientes').select('*');

  const yonathan = patients.find(p => p.nome.toLowerCase().includes('yonathan'));
  const eliza = patients.find(p => p.nome.toLowerCase().includes('eliza'));

  console.log('Yonathan:', yonathan ? { id: yonathan.id, nome: yonathan.nome, status: yonathan.status } : 'NOT FOUND');
  console.log('Eliza:', eliza ? { id: eliza.id, nome: eliza.nome, status: eliza.status } : 'NOT FOUND');

  if (yonathan) {
    console.log('\n--- YONATHAN APPOINTMENTS ---');
    const { data: ags } = await supabase.from('agendamentos').select('*').eq('paciente_id', yonathan.id);
    console.log(ags.map(a => ({ id: a.id, data_inicio: a.data_inicio, status: a.status, servico_id: a.servico_id })));

    console.log('\n--- YONATHAN FATURAS ---');
    const { data: fats } = await supabase.from('faturas').select('*').eq('paciente_id', yonathan.id);
    console.log(fats);
  }

  if (eliza) {
    console.log('\n--- ELIZA APPOINTMENTS ---');
    const { data: ags } = await supabase.from('agendamentos').select('*').eq('paciente_id', eliza.id);
    console.log(ags.map(a => ({ id: a.id, data_inicio: a.data_inicio, status: a.status, servico_id: a.servico_id })));

    console.log('\n--- ELIZA FATURAS ---');
    const { data: fats } = await supabase.from('faturas').select('*').eq('paciente_id', eliza.id);
    console.log(fats);
  }
}

run();
