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
      .gte("data_inicio", "2026-07-01T00:00:00")
      .lte("data_inicio", "2026-07-31T23:59:59");
    
    if (error) throw error;

    console.log(`Total appointments in July: ${ags.length}`);
    const statusCount = {};
    ags.forEach(a => {
      statusCount[a.status] = (statusCount[a.status] || 0) + 1;
    });
    console.log("July Status Counts:", statusCount);
  } catch (err) {
    console.error(err);
  }
}

check();
