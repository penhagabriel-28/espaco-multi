import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function inspectFatura(id) {
  const { data: fatura, error: fErr } = await supabase.from("faturas").select("*").eq("id", id).single();
  if (fErr) {
    console.error("Fatura error:", fErr);
    return;
  }
  const { data: items, error: iErr } = await supabase.from("fatura_itens").select("*").eq("fatura_id", id);
  if (iErr) {
    console.error("Items error:", iErr);
    return;
  }

  console.log(`=== FATURA ${id} ===`);
  console.log(fatura);
  console.log("=== ITEMS ===");
  console.log(items);
}

inspectFatura("331f1ab0-567e-446d-bee8-e51f2e457703");
