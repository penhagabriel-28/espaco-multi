import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  try {
    const { data: fats, error } = await supabase
      .from("faturas")
      .select("status, valor, competencia")
      .gte("competencia", "2026-06-01")
      .lte("competencia", "2026-06-30");
    
    if (error) throw error;

    let faturamentoRecebido = 0;
    let faturamentoAReceber = 0;
    let faturamentoTotal = 0;

    fats.forEach(f => {
      if (f.status === "paga") {
        faturamentoRecebido += Number(f.valor);
      } else if (f.status === "aberta") {
        faturamentoAReceber += Number(f.valor);
      }
      if (f.status !== "cancelada") {
        faturamentoTotal += Number(f.valor);
      }
    });

    console.log(`Total faturas in June: ${fats.length}`);
    console.log(`Faturamento Recebido (paid): R$ ${faturamentoRecebido}`);
    console.log(`Faturamento A Receber (open): R$ ${faturamentoAReceber}`);
    console.log(`Faturamento Total (all except canceled): R$ ${faturamentoTotal}`);
  } catch (err) {
    console.error(err);
  }
}

check();
