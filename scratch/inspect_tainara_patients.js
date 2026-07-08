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
  console.log('Fetching patients and professional...');
  const { data: patients } = await supabase.from('pacientes').select('*');
  const { data: profs } = await supabase.from('profissionais').select('*');

  const dominic = patients.find(p => p.nome.toLowerCase().includes('dominic'));
  const juliana = patients.find(p => p.nome.toLowerCase().includes('juliana') && p.nome.toLowerCase().includes('vieira'));
  const tainara = profs.find(p => p.nome.toLowerCase().includes('tainara'));

  console.log('Dominic:', dominic ? JSON.stringify({ id: dominic.id, nome: dominic.nome, cids_secundarios: dominic.cids_secundarios, apoio_frequencia: dominic.apoio_frequencia, apoio_valor_personalizado: dominic.apoio_valor_personalizado }, null, 2) : 'NOT FOUND');
  console.log('Juliana:', juliana ? JSON.stringify({ id: juliana.id, nome: juliana.nome, cids_secundarios: juliana.cids_secundarios, apoio_frequencia: juliana.apoio_frequencia, apoio_valor_personalizado: juliana.apoio_valor_personalizado }, null, 2) : 'NOT FOUND');
  console.log('Tainara:', tainara ? JSON.stringify({ id: tainara.id, nome: tainara.nome, valor_sessao: tainara.valor_sessao, valores_config: tainara.valores_config }, null, 2) : 'NOT FOUND');

  const { data: pricingResult, error: pricingError } = await supabase
    .rpc('fn_get_pricing', {
      p_paciente_id: dominic.id,
      p_profissional_id: tainara.id,
      p_especialidade: 'AT ABA',
      p_tipo_agendamento: 'sessao'
    });
  console.log('fn_get_pricing result:', pricingResult, 'error:', pricingError);
}

run();
