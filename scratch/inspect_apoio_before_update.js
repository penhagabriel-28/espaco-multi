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

const patientQueries = [
  'Ana Pérola Oliveira de Jesus',
  'Arthur Fernando Pinto Ulloa Soto',
  'Deivid Emanuel Ferreira de Sousa',
  'Júlia Rica Carvalho de Brito',
  'Lorenzo Braga Serra',
  'Luís Victor Abreu do Nascimento',
  'Luiz Henrique de Matos',
  'Maria Isabelly Fonseca dos Santos',
  'Pedro Rafael de O. Sodré',
  'Phillipe Emanuel Corrêa Soares',
  'Théo Felipe Oliveira Barros',
  'Valentina'
];

const profQueries = [
  'Cleide',
  'Acioniza Ferreira',
  'Tainara Martins',
  'Danielle',
  'Dailson'
];

async function inspect() {
  console.log('--- INSPECTING PROFESSIONALS ---');
  const { data: profs, error: profErr } = await supabase.from('profissionais').select('id, nome, especialidade, ativo');
  if (profErr) {
    console.error('Error fetching professionals:', profErr);
    return;
  }
  
  for (const q of profQueries) {
    const matched = profs.filter(p => p.nome.toLowerCase().includes(q.toLowerCase()));
    console.log(`Query: "${q}" -> Found:`, matched.map(p => `${p.nome} (ID: ${p.id}, Active: ${p.ativo})`).join(' | ') || 'NONE');
  }

  console.log('\n--- INSPECTING PATIENTS ---');
  const { data: patients, error: patErr } = await supabase.from('pacientes').select('id, nome, cids_secundarios, apoio_frequencia, apoio_valor_personalizado');
  if (patErr) {
    console.error('Error fetching patients:', patErr);
    return;
  }

  for (const q of patientQueries) {
    const matched = patients.filter(p => p.nome.toLowerCase().includes(q.toLowerCase()));
    console.log(`Query: "${q}" -> Found:`, matched.map(p => `${p.nome} (ID: ${p.id}, Freq: ${p.apoio_frequencia}, Val: ${p.apoio_valor_personalizado})`).join(' | ') || 'NONE');
  }
}

inspect();
