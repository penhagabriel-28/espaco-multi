import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function verify() {
  try {
    const { data: fats, error: fErr } = await supabase.from("faturas").select("id, valor, status");
    if (fErr) throw fErr;

    const zeroFats = fats.filter(f => f.valor === 0 || f.valor === null);
    console.log(`Total faturas: ${fats.length}`);
    console.log(`Faturas with R$ 0 value: ${zeroFats.length}`);

    // For any zero faturas, check if they have items
    let zeroFatsWithItems = 0;
    for (const f of zeroFats) {
      const { data: items, error: iErr } = await supabase.from("fatura_itens").select("id").eq("fatura_id", f.id);
      if (iErr) throw iErr;
      if (items && items.length > 0) {
        console.log(`Fatura ${f.id} has R$ 0 value but contains ${items.length} items.`);
        zeroFatsWithItems++;
      }
    }
    console.log(`Faturas with R$ 0 value and non-empty items: ${zeroFatsWithItems}`);
  } catch (err) {
    console.error(err);
  }
}

verify();
