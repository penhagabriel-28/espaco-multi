import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function debug() {
  // Let's get the selected month dates
  const inicio = '2026-06-01';
  const fim = '2026-06-30';

  // 1. Fetch faturas
  const { data: faturas } = await supabase
    .from('faturas')
    .select('*')
    .gte('competencia', inicio)
    .lte('competencia', fim);

  // 2. Fetch fatura_itens
  const { data: faturaItens } = await supabase
    .from('fatura_itens')
    .select('*, faturas(*)');

  // 3. Calculate linkedAgendamentoIds
  const ids = new Set();
  faturaItens.forEach(item => {
    const comp = item.faturas?.competencia || item.competencia; // depending on relation
    // wait, in database faturas has competencia, let's verify where competencia is in item.faturas
    const fatComp = item.faturas?.competencia;
    if (fatComp && fatComp >= inicio && fatComp <= fim && item.agendamento_id) {
      ids.add(item.agendamento_id);
    }
  });
  const linkedAgendamentoIds = Array.from(ids);
  console.log(`linkedAgendamentoIds count: ${linkedAgendamentoIds.length}`);

  // 4. Fetch linked agendamentos
  let linkedAgendamentos = [];
  if (linkedAgendamentoIds.length > 0) {
    const { data } = await supabase
      .from('agendamentos')
      .select('id, profissional_id, status, data_inicio')
      .in('id', linkedAgendamentoIds);
    linkedAgendamentos = data || [];
  }
  console.log(`linkedAgendamentos count: ${linkedAgendamentos.length}`);

  // 5. Construct Maps
  const agendamentoProfIdMap = new Map();
  linkedAgendamentos.forEach(ag => {
    if (ag.id && ag.profissional_id) {
      agendamentoProfIdMap.set(ag.id, ag.profissional_id);
    }
  });

  const faturaProfIdsMap = new Map();
  faturas.forEach(f => {
    if (f.profissional_id) {
      const set = faturaProfIdsMap.get(f.id) || new Set();
      set.add(f.profissional_id);
      faturaProfIdsMap.set(f.id, set);
    }
  });

  faturaItens.forEach(item => {
    const fatId = item.fatura_id;
    if (!fatId) return;

    const profId = item.agendamento_id ? agendamentoProfIdMap.get(item.agendamento_id) : null;
    if (profId) {
      const set = faturaProfIdsMap.get(fatId) || new Set();
      set.add(profId);
      faturaProfIdsMap.set(fatId, set);
    }
  });

  // Let's print out what we mapped for faturas that are Apoio
  console.log("\n=== MAPPED APOIO FATURAS ===");
  faturas.filter(f => f.especialidade === 'Apoio').forEach(f => {
    const profs = faturaProfIdsMap.get(f.id);
    console.log(`Fatura ID: ${f.id}, Paciente ID: ${f.paciente_id}, Profs:`, profs ? Array.from(profs) : 'NONE');
  });
}

debug();
