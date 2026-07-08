import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  try {
    const { data: ags, error } = await supabase
      .from("agendamentos")
      .select("id, status, data_inicio, paciente_id, profissional_id, servico_id, observacoes")
      .eq("status", "pendente")
      .gte("data_inicio", "2026-06-18T00:00:00")
      .lte("data_inicio", "2026-07-06T23:59:59");
    
    if (error) throw error;

    console.log(`Pending appointments between June 18 and July 6: ${ags.length}`);

    // Let's resolve the price for each to get a total estimate
    // Fetch pricing function or mock it using typical values (e.g. 120)
    let totalEst = 0;
    ags.forEach(a => {
      // Typical session price is 120-130
      totalEst += 120;
    });

    console.log(`Estimated additional faturamento: R$ ${totalEst}`);

  } catch (err) {
    console.error(err);
  }
}

check();
