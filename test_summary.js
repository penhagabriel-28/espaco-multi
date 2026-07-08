import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/) || env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/);
const secretKey = key[1];

const supabase = createClient(url, secretKey);

async function test() {
  // Fetch faturas
  const { data: faturas } = await supabase.from('faturas').select('*');
  // Fetch fatura_itens
  const { data: faturaItens } = await supabase.from('fatura_itens').select('*');
  // Fetch profissionais
  const { data: profissionais } = await supabase.from('profissionais').select('*');
  // Fetch pacientes
  const { data: pacientes } = await supabase.from('pacientes').select('*, paciente_profissional(*)');

  const professionalMap = new Map(profissionais.map(p => [p.id, p.nome]));
  const professionalSpecsMap = new Map(profissionais.map(p => [p.id, p.especialidade || ""]));
  const patientDetailsMap = new Map(pacientes.map(p => [p.id, p]));
  
  // Create agendamentoProfIdMap
  const { data: ags } = await supabase.from('agendamentos').select('id, profissional_id');
  const agendamentoProfIdMap = new Map((ags || []).map(a => [a.id, a.profissional_id]));

  const professionalMatchesSpecialty = (profId, fatSpecialty) => {
    if (!fatSpecialty) return true;
    const specsStr = professionalSpecsMap.get(profId);
    if (specsStr === undefined) return true;
    const cleanFat = fatSpecialty.trim().toLowerCase();
    const cleanSpecs = specsStr.split(",").map(s => s.trim().toLowerCase());
    return cleanSpecs.includes(cleanFat);
  };

  const faturaProfIdsMap = new Map();
  (faturas || []).forEach((f) => {
    const set = faturaProfIdsMap.get(f.id) || new Set();
    if (f.profissional_id) {
      set.add(f.profissional_id);
    } else {
      const p = patientDetailsMap.get(f.paciente_id);
      const pProfs = p?.paciente_profissional || [];
      pProfs.forEach((pp) => {
        if (professionalMatchesSpecialty(pp.profissional_id, f.especialidade)) {
          set.add(pp.profissional_id);
        }
      });
    }
    if (set.size > 0) {
      faturaProfIdsMap.set(f.id, set);
    }
  });

  (faturaItens || []).forEach((item) => {
    const fatId = item.fatura_id;
    if (!fatId) return;
    const profId = item.agendamento_id ? agendamentoProfIdMap.get(item.agendamento_id) : null;
    if (profId) {
      const set = faturaProfIdsMap.get(fatId) || new Set();
      set.add(profId);
      faturaProfIdsMap.set(fatId, set);
    }
  });

  // Let's test for Pedro Rafael de O. Sodré
  const pedro = pacientes.find(p => p.nome.includes("Pedro Rafael"));
  if (!pedro) {
    console.log("Pedro Rafael not found.");
    return;
  }

  const patientId = pedro.id;
  const pendingFats = (faturas || []).filter(
    (f) => f.paciente_id === patientId && (f.status === 'aberta' || f.status === 'vencida' || f.status === 'paga') // Let's include paid ones for test output too
  );

  console.log(`Faturas for ${pedro.nome}:`, pendingFats.length);

  // Grouping logic for summary
  const summaryLines = [];
  pendingFats.forEach((f) => {
    if (f.especialidade === "Apoio") {
      const p = patientDetailsMap.get(f.paciente_id);
      const freq = p?.apoio_frequencia || 'avulso';
      const freqLabels = {
        avulso: "Pacote Apoio - Sessões Avulsas",
        "1x": "Pacote Apoio - 1x por semana",
        "2x": "Pacote Apoio - 2x por semana",
        "3x": "Pacote Apoio - 3x por semana",
        semana_toda: "Pacote Apoio - Semana Inteira",
      };
      const desc = freqLabels[freq] || "Pacote Apoio";
      const fatProfs = faturaProfIdsMap.get(f.id);
      let profNome = "";
      if (fatProfs && fatProfs.size > 0) {
        profNome = Array.from(fatProfs)
          .map((pId) => professionalMap.get(pId))
          .filter(Boolean)
          .join(", ") || "—";
      } else {
        const pProfs = p?.paciente_profissional || [];
        profNome = pProfs
          .filter((pp) => professionalMatchesSpecialty(pp.profissional_id, f.especialidade))
          .map((pp) => professionalMap.get(pp.profissional_id))
          .filter(Boolean)
          .join(", ") || "—";
      }
      summaryLines.push(`• ${desc} (${profNome})`);
    } else {
      // General/sessions faturas
      const items = (faturaItens || []).filter((item) => item.fatura_id === f.id);
      if (items.length === 0) {
        // Manual/no items
        const profNome = f.profissional_id ? (professionalMap.get(f.profissional_id) || "—") : "—";
        const spec = f.especialidade || "Atendimentos";
        summaryLines.push(`• Cobrança de ${spec} (${profNome})`);
      } else {
        // Group items by professional and specialty
        const groups = {};
        items.forEach((item) => {
          const profId = item.agendamento_id ? agendamentoProfIdMap.get(item.agendamento_id) : f.profissional_id;
          const profName = profId ? (professionalMap.get(profId) || "—") : "—";
          const spec = f.especialidade || "Atendimento";
          const key = `${spec}-${profName}`;
          if (!groups[key]) {
            groups[key] = { spec, profName, count: 0 };
          }
          groups[key].count++;
        });
        Object.values(groups).forEach((g) => {
          summaryLines.push(`• ${g.count} sessão(ões) de ${g.spec} com ${g.profName}`);
        });
      }
    }
  });

  console.log("Generated Summary Lines:");
  console.log(summaryLines.join("\n"));
}

test();
