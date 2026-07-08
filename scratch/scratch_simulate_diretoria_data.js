import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function simulate() {
  const inicio = '2026-06-01';
  const fim = '2026-06-30';

  // 1. Fetch faturas
  const { data: faturas = [] } = await supabase
    .from('faturas')
    .select(`
      id, competencia, status, valor, pago_em, metodo, vencimento, profissional_id, especialidade, paciente_id
    `)
    .gte('competencia', inicio)
    .lte('competencia', fim);

  // 2. Fetch fatura_itens
  const { data: faturaItens = [] } = await supabase
    .from('fatura_itens')
    .select(`
      id, fatura_id, total, valor_unitario, agendamento_id, descricao,
      faturas ( id, status, pago_em, metodo, vencimento, profissional_id, especialidade, paciente_id, competencia, valor )
    `);

  // 3. Fetch patients
  const { data: pacientes = [] } = await supabase
    .from('pacientes')
    .select('id, nome, valor_mensal')
    .order('nome');

  const patientMap = new Map(pacientes.map(p => [p.id, p.nome]));
  const patientDetailsMap = new Map(pacientes.map(p => [p.id, p]));

  // 4. Calculate linkedAgendamentoIds
  const ids = new Set();
  faturaItens.forEach(item => {
    const comp = item.faturas?.competencia;
    if (comp && comp >= inicio && comp <= fim && item.agendamento_id) {
      ids.add(item.agendamento_id);
    }
  });
  const linkedAgendamentoIds = Array.from(ids);

  // 5. Fetch linked agendamentos
  let linkedAgendamentos = [];
  if (linkedAgendamentoIds.length > 0) {
    const { data } = await supabase
      .from('agendamentos')
      .select('id, profissional_id, status, data_inicio')
      .in('id', linkedAgendamentoIds);
    linkedAgendamentos = data || [];
  }

  const agendamentoProfIdMap = new Map();
  linkedAgendamentos.forEach(ag => {
    if (ag.id && ag.profissional_id) {
      agendamentoProfIdMap.set(ag.id, ag.profissional_id);
    }
  });

  // 6. faturaProfIdsMap
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

  // Let's get all professionals
  const { data: profissionais = [] } = await supabase
    .from('profissionais')
    .select('id, nome, especialidade');

  console.log(`Loaded ${faturas.length} faturas, ${faturaItens.length} itens, ${pacientes.length} patients, ${profissionais.length} professionals.`);

  // Test selecting each professional
  for (const prof of profissionais) {
    const profFilter = prof.id;

    // Filter consolidated
    const consolidatedPatients = [];
    const map = new Map();

    for (const f of faturas) {
      if (profFilter !== 'all') {
        const profIds = faturaProfIdsMap.get(f.id);
        if (!profIds || !profIds.has(profFilter)) continue;
      }

      const pId = f.paciente_id;
      if (!pId) continue;
      const patientName = patientMap.get(pId) || 'Paciente Desconhecido';

      let entry = map.get(pId);
      if (!entry) {
        entry = { pacienteId: pId, nome: patientName, faturas: [] };
        map.set(pId, entry);
      }
      entry.faturas.push(f);
    }

    const filteredConsolidated = Array.from(map.values());

    if (filteredConsolidated.length > 0) {
      console.log(`\nFiltered for Prof ${prof.nome} (${prof.especialidade}): ${filteredConsolidated.length} patient records found!`);
      filteredConsolidated.forEach(c => {
        console.log(`  - Patient: ${c.nome}, Faturas count: ${c.faturas.length}`);
      });
    }
  }
}

simulate();
