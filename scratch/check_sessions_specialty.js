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
  'Lorenzo Braga Serra',
  'Luís Victor Abreu do Nascimento',
  'Théo Felipe Oliveira Barros'
];

async function run() {
  const { data: patients } = await supabase.from('pacientes').select('id, nome');
  const matchedPatients = [];
  
  for (const q of patientQueries) {
    const p = patients.find(p => p.nome.toLowerCase().includes(q.toLowerCase()));
    if (p) matchedPatients.push(p);
  }

  const pIds = matchedPatients.map(p => p.id);
  const { data: ags } = await supabase
    .from('agendamentos')
    .select('id, paciente_id, data_inicio, status, servico_id, profissional_id')
    .in('paciente_id', pIds)
    .gte('data_inicio', '2026-07-01')
    .lte('data_inicio', '2026-07-31T23:59:59');

  const anaPerola = matchedPatients.find(p => p.nome.includes('Pérola'));
  if (anaPerola) {
    const anaAgs = ags.filter(a => a.paciente_id === anaPerola.id);
    console.log(`Ana Pérola has ${anaAgs.length} July sessions:`);
    for (const a of anaAgs) {
      // Fetch service name
      let sName = 'NONE';
      if (a.servico_id) {
        const { data: s } = await supabase.from('servicos').select('nome').eq('id', a.servico_id).single();
        sName = s?.nome || 'NOT_FOUND';
      }
      
      // Fetch professional name and specialty
      let pName = 'NONE', pSpec = 'NONE';
      if (a.profissional_id) {
        const { data: pr } = await supabase.from('profissionais').select('nome, especialidade').eq('id', a.profissional_id).single();
        pName = pr?.nome || 'NOT_FOUND';
        pSpec = pr?.especialidade || 'NONE';
      }
      
      console.log(`- Date: ${a.data_inicio} | Status: ${a.status} | Service: "${sName}" | Prof: "${pName}" (Spec: "${pSpec}")`);
    }
  }
}

run();
