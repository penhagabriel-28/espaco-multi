import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/) || env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/);
const secretKey = key[1];

const supabase = createClient(url, secretKey);

async function test() {
  const { data: profs } = await supabase
    .from('profissionais')
    .select('id, nome, valores_config')
    .in('nome', ['Kátia Tereza', 'Sonileny Pinheiro', 'Naianny Maramaldo']);

  const { data: pacientes } = await supabase.from('pacientes').select('id, nome');
  const pacMap = new Map((pacientes || []).map(p => [p.id, p.nome]));

  (profs || []).forEach(p => {
    console.log(`\nProfessional: ${p.nome} (${p.id})`);
    console.log("Discounts:");
    const descontos = p.valores_config?.descontos || [];
    descontos.forEach(d => {
      console.log(`  Patient: ${pacMap.get(d.paciente_id)} (${d.paciente_id})`);
      console.log(`    Especialidade: ${d.especialidade}`);
      console.log(`    Valor Sessão: ${d.valor_sessao}`);
      console.log(`    Valor Avaliação: ${d.valor_avaliacao}`);
    });
  });
}

test();
