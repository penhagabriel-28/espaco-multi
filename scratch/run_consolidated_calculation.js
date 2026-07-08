import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { format, startOfMonth, endOfMonth, startOfDay, differenceInDays } from 'date-fns';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

const today = new Date();
const inicio = format(startOfMonth(today), "yyyy-MM-dd");
const fim = format(endOfMonth(today), "yyyy-MM-dd");

async function run() {
  const { data: faturas } = await supabase
    .from("faturas")
    .select("id, valor, status, competencia, vencimento, pago_em, metodo, observacoes, paciente_id, profissional_id, especialidade")
    .gte("competencia", inicio)
    .lte("competencia", fim);

  console.log(`Faturas loaded for ${inicio} to ${fim}: ${faturas?.length}`);

  const { data: pacientes } = await supabase
    .from("pacientes")
    .select("id, nome, valor_mensal, cids_secundarios, apoio_frequencia, apoio_valor_personalizado");

  const patientMap = new Map((pacientes || []).map((p) => [p.id, p.nome]));
  const patientDetailsMap = new Map((pacientes || []).map((p) => [p.id, p]));

  // Mock faturaProfIdsMap as empty since we filter by 'all' first
  const map = new Map();
  for (const f of faturas || []) {
    const pId = f.paciente_id;
    if (!pId) continue;
    const patientName = patientMap.get(pId) || "Paciente Desconhecido";
    const pDetails = patientDetailsMap.get(pId);
    
    const billingType = f.especialidade === "Apoio" 
      ? "mensal" 
      : (pDetails && pDetails.valor_mensal && pDetails.valor_mensal > 0 ? "mensal" : "sessao");

    const key = `${pId}-${billingType}`;

    let entry = map.get(key);
    if (!entry) {
      entry = {
        key,
        pacienteId: pId,
        billingType,
        nome: patientName,
        faturas: [],
      };
      map.set(key, entry);
    }
    entry.faturas.push(f);
  }

  const consolidated = Array.from(map.values());
  console.log(`Consolidated count: ${consolidated.length}`);
  if (consolidated.length > 0) {
    console.log("Consolidated entries sample:");
    consolidated.slice(0, 5).forEach(c => {
      console.log(`- Patient: ${c.nome}, Billing Type: ${c.billingType}, Invoices: ${c.faturas.length}`);
    });
  }
}

run();
