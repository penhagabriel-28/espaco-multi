import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function simulateUI() {
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

  // 3. Fetch patients MIN (as done in _app.diretoria.tsx line 173)
  const { data: pacientesMin = [] } = await supabase
    .from('pacientes')
    .select('id, nome, valor_mensal')
    .order('nome');

  const patientMap = new Map(pacientesMin.map(p => [p.id, p.nome]));
  const patientDetailsMap = new Map(pacientesMin.map(p => [p.id, p]));

  // 4. Calculate linkedAgendamentos
  const ids = new Set();
  faturaItens.forEach(item => {
    const comp = item.faturas?.competencia;
    if (comp && comp >= inicio && comp <= fim && item.agendamento_id) {
      ids.add(item.agendamento_id);
    }
  });
  const linkedAgendamentoIds = Array.from(ids);

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

  // Choose Danielle (Apoio)
  const profFilter = 'e3bbf9ad-5fb2-4752-9d3f-561b36952402'; // Danielle's real ID is 3c8b56b4-6590-468d-96f6-cdf7310baf24 from previous output!
  const realDanielleId = '3c8b56b4-6590-468d-96f6-cdf7310baf24';

  const map = new Map();
  for (const f of faturas) {
    const profIds = faturaProfIdsMap.get(f.id);
    if (!profIds || !profIds.has(realDanielleId)) continue;

    const pId = f.paciente_id;
    if (!pId) continue;
    const patientName = patientMap.get(pId) || 'Paciente Desconhecido';

    let entry = map.get(pId);
    if (!entry) {
      entry = { pacienteId: pId, nome: patientName, totalPendente: 0, totalPago: 0, temAtraso: false };
      map.set(pId, entry);
    }
  }

  const filteredConsolidated = Array.from(map.values());
  console.log(`filteredConsolidated size for Danielle: ${filteredConsolidated.length}`);

  // Now run the mensal / sessao filters
  const mensal = filteredConsolidated.filter((c) => {
    const p = patientDetailsMap.get(c.pacienteId);
    if (!p) return false;
    // hasApoio check in the frontend
    const hasApoio = Array.isArray(p.cids_secundarios) && p.cids_secundarios.some((s) => s.toLowerCase() === "apoio" || s.toUpperCase() === "AP");
    if (hasApoio) {
      return p.apoio_frequencia && p.apoio_frequencia !== "avulso";
    }
    return p.valor_mensal && p.valor_mensal > 0;
  });

  const sessao = filteredConsolidated.filter((c) => {
    const p = patientDetailsMap.get(c.pacienteId);
    if (!p) return true;
    const hasApoio = Array.isArray(p.cids_secundarios) && p.cids_secundarios.some((s) => s.toLowerCase() === "apoio" || s.toUpperCase() === "AP");
    if (hasApoio) {
      return !p.apoio_frequencia || p.apoio_frequencia === "avulso";
    }
    return !p.valor_mensal || p.valor_mensal === 0;
  });

  console.log(`mensal count: ${mensal.length}`);
  console.log(`sessao count: ${sessao.length}`);
}

simulateUI();
