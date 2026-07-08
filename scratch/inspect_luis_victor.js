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
  console.log('Fetching patients and professionals...');
  const { data: patients } = await supabase.from('pacientes').select('*');
  const { data: profs } = await supabase.from('profissionais').select('*');

  const luis = patients.find(p => p.nome.toLowerCase().includes('luís victor') || p.nome.toLowerCase().includes('luis victor'));
  const cleide = profs.find(p => p.nome.toLowerCase().includes('cleide'));

  console.log('Luís Victor:', luis ? { id: luis.id, nome: luis.nome, cids_secundarios: luis.cids_secundarios, apoio_frequencia: luis.apoio_frequencia, apoio_valor_personalizado: luis.apoio_valor_personalizado } : 'NOT FOUND');
  console.log('Cleide:', cleide ? { id: cleide.id, nome: cleide.nome } : 'NOT FOUND');

  if (luis) {
    // Fetch paciente_profissional
    const { data: pp } = await supabase
      .from('paciente_profissional')
      .select('*')
      .eq('paciente_id', luis.id);
    console.log('paciente_profissional:', pp);

    // Fetch faturas
    const { data: faturas } = await supabase
      .from('faturas')
      .select('*')
      .eq('paciente_id', luis.id);
    console.log('Faturas:', faturas);
  }
}

run();
