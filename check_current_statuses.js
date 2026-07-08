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
      .select("status, data_inicio")
      .gte("data_inicio", "2026-06-18T00:00:00")
      .lte("data_inicio", "2026-07-06T23:59:59");
    
    if (error) throw error;

    console.log(`Total appointments between June 18 and July 6: ${ags.length}`);
    const counts = {};
    ags.forEach(a => {
      counts[a.status] = (counts[a.status] || 0) + 1;
    });
    console.log("Status counts:", counts);
  } catch (err) {
    console.error(err);
  }
}

check();
