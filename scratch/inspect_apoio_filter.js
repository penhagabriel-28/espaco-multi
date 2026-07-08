import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function inspect() {
  // Get all faturas of specialty Apoio
  const { data: faturas, error: fatError } = await supabase
    .from('faturas')
    .select('*')
    .eq('especialidade', 'Apoio');

  if (fatError) {
    console.error("Error fetching faturas:", fatError);
    return;
  }

  console.log(`=== APOIO FATURAS (Total: ${faturas.length}) ===`);
  faturas.slice(0, 5).forEach(f => {
    console.log(`ID: ${f.id}, Paciente: ${f.paciente_id}, Competencia: ${f.competencia}, Profissional ID: ${f.profissional_id}`);
  });

  // Get items for these faturas
  const fatIds = faturas.map(f => f.id);
  const { data: items, error: itemsError } = await supabase
    .from('fatura_itens')
    .select('*, agendamentos(*)')
    .in('fatura_id', fatIds);

  if (itemsError) {
    console.error("Error fetching items:", itemsError);
    return;
  }

  console.log(`\n=== FATURA ITENS (Total: ${items.length}) ===`);
  items.slice(0, 10).forEach(item => {
    console.log(`ID: ${item.id}, Fatura ID: ${item.fatura_id}, Agendamento ID: ${item.agendamento_id}, Desc: ${item.descricao}, AgStatus: ${item.agendamentos?.status}, AgProf: ${item.agendamentos?.profissional_id}`);
  });

  // Check professionals who are Apoio
  const { data: profs, error: profsError } = await supabase
    .from('profissionais')
    .select('*');

  if (profsError) {
    console.error("Error fetching profs:", profsError);
    return;
  }

  const apoioProfs = profs.filter(p => p.especialidade && (p.especialidade.toLowerCase().includes('apoio') || p.especialidade.toUpperCase().includes('AP')));
  console.log(`\n=== APOIO PROFESSIONALS (Total: ${apoioProfs.length}) ===`);
  apoioProfs.forEach(p => {
    console.log(`ID: ${p.id}, Nome: ${p.nome}, Especialidade: ${p.especialidade}`);
  });
}

inspect();
