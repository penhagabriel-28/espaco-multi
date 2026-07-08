import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function run() {
  const inicio = "2026-06-01";
  const fim = "2026-06-30";

  console.log(`Running test query for ${inicio} to ${fim}...`);

  try {
    const { data: fList, error: fError } = await supabase
      .from("faturas")
      .select("id")
      .gte("competencia", inicio)
      .lte("competencia", fim);
    if (fError) throw fError;
    
    const fIds = (fList || []).map((f) => f.id);
    console.log(`Loaded ${fIds.length} fatura IDs.`);
    if (fIds.length === 0) return;
    
    const chunkSize = 100;
    const chunks = [];
    for (let i = 0; i < fIds.length; i += chunkSize) {
      chunks.push(fIds.slice(i, i + chunkSize));
    }
    
    const promises = chunks.map(async (chunk) => {
      const { data, error } = await supabase
        .from("fatura_itens")
        .select(`
          id,
          fatura_id,
          total,
          valor_unitario,
          agendamento_id,
          descricao,
          faturas (
            id,
            status,
            pago_em,
            metodo,
            vencimento,
            profissional_id,
            especialidade,
            paciente_id,
            competencia,
            valor
          )
        `)
        .in("fatura_id", chunk);
      if (error) throw error;
      return data || [];
    });
    
    const results = await Promise.all(promises);
    const flat = results.flat();
    console.log(`Successfully fetched ${flat.length} fatura items.`);
  } catch (e) {
    console.error("Query failed with error:", e);
  }
}

run();
