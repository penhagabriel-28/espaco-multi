import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function fetchAll(table, fields) {
  let allData = [];
  let from = 0;
  let to = 999;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(fields)
      .range(from, to)
      .order('id');
    
    if (error) {
      throw error;
    }
    allData.push(...data);
    if (data.length < 1000) break;
    from += 1000;
    to += 1000;
  }
  return allData;
}

async function inspect() {
  try {
    console.log("Fetching all agendamentos from CURRENT DB...");
    const ags = await fetchAll("agendamentos", "id, status, data_inicio, assinatura_responsavel, nome_assinante");
    console.log(`Total: ${ags.length}`);

    const byMonthAndStatus = {};
    ags.forEach(a => {
      if (!a.data_inicio) return;
      const month = a.data_inicio.slice(0, 7); // YYYY-MM
      if (!byMonthAndStatus[month]) {
        byMonthAndStatus[month] = {};
      }
      byMonthAndStatus[month][a.status] = (byMonthAndStatus[month][a.status] || 0) + 1;
    });

    console.log("Status count by month:");
    console.log(JSON.stringify(byMonthAndStatus, null, 2));

  } catch (err) {
    console.error(err);
  }
}

inspect();
