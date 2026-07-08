import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read service role key from Robozinho Integrar\.env
const env = fs.readFileSync("C:\\Users\\Windows 10\\Desktop\\Robozinho Integrar\\Integrar\\.env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const serviceRoleKey = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, serviceRoleKey);

async function check() {
  try {
    console.log(`Checking sfkejiqyhqzljoumgjxh database using service role key...`);
    const tables = ["pacientes", "agendamentos", "faturas", "fatura_itens"];
    
    for (const t of tables) {
      const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
      if (error) {
        console.error(`Error counting ${t}:`, error.message);
      } else {
        console.log(`Table ${t}: ${count} rows`);
      }
    }

    // If there are agendamentos, let's fetch a few to see their dates
    const { data: ags } = await supabase.from("agendamentos").select("id, status, data_inicio").limit(5);
    if (ags && ags.length > 0) {
      console.log("Sample agendamentos from Integrar DB:", ags);
    }
  } catch (err) {
    console.error(err);
  }
}

check();
