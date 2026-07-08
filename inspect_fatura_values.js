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
    const items = await fetchAll("fatura_itens", "id, total, valor_unitario, fatura_id");
    const fats = await fetchAll("faturas", "id, valor, status");

    console.log(`Fatura itens: total ${items.length}`);
    const nonZeroItems = items.filter(i => i.total > 0);
    console.log(`Non-zero fatura_itens: ${nonZeroItems.length}`);
    if (items.length > 0) {
      console.log("Sample item values:", items.slice(0, 5));
    }

    console.log(`Faturas: total ${fats.length}`);
    const nonZeroFats = fats.filter(f => f.valor > 0);
    console.log(`Non-zero faturas: ${nonZeroFats.length}`);
    if (fats.length > 0) {
      console.log("Sample fatura values:", fats.slice(0, 5));
    }

  } catch (err) {
    console.error(err);
  }
}

inspect();
