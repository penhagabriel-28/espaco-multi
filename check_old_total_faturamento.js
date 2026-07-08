import { createClient } from "@supabase/supabase-js";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const oldSupabase = createClient(oldUrl, oldKey);

async function check() {
  try {
    const { data: fats, error } = await oldSupabase
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

    console.log(`Total faturas in old June: ${fats.length}`);
    console.log(`Old Faturamento Recebido (paid): R$ ${faturamentoRecebido}`);
    console.log(`Old Faturamento A Receber (open): R$ ${faturamentoAReceber}`);
    console.log(`Old Faturamento Total (all except canceled): R$ ${faturamentoTotal}`);

    // Print all faturas with their values to see if they match the consolidated amounts
    console.log("\nSample faturas from old DB:");
    console.log(fats.slice(0, 10));
  } catch (err) {
    console.error(err);
  }
}

check();
