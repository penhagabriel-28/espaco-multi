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

async function run() {
  const { data: patients } = await supabase.from('pacientes').select('id, nome');
  const matchedPatients = [];
  
  for (const q of patientQueries) {
    const p = patients.find(p => p.nome.toLowerCase().includes(q.toLowerCase()));
    if (p) matchedPatients.push(p);
  }

  console.log(`Matched ${matchedPatients.length} patients.`);

  const pIds = matchedPatients.map(p => p.id);
  const { data: ags, error } = await supabase
    .from('agendamentos')
    .select('id, paciente_id, data_inicio, status, servico_id, profissional_id')
    .in('paciente_id', pIds);

  if (error) {
    console.error('Error fetching agendamentos:', error);
    return;
  }

  console.log(`Found ${ags.length} total agendamentos for these patients.`);
  
  const mIsabelly = matchedPatients.find(p => p.nome.includes('Isabelly'));
  const valentina = matchedPatients.find(p => p.nome.toLowerCase() === 'valentina');
  
  if (mIsabelly) {
    const isAgs = ags.filter(a => a.paciente_id === mIsabelly.id);
    console.log(`Maria Isabelly has ${isAgs.length} total agendamentos. Dates:`, isAgs.map(a => `${a.data_inicio} (${a.status})`));
  }
  if (valentina) {
    const valAgs = ags.filter(a => a.paciente_id === valentina.id);
    console.log(`Valentina has ${valAgs.length} total agendamentos. Dates:`, valAgs.map(a => `${a.data_inicio} (${a.status})`));
  }
}

run();
