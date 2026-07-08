import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function testQuery() {
  const { data, error } = await supabase.from("fatura_itens").select(`
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
        `);

  if (error) {
    console.error("Query failed:", error);
  } else {
    console.log(`Query succeeded! Returned ${data.length} rows.`);
    console.log("Sample row faturas relation:", data[0]?.faturas);
  }
}

testQuery();
