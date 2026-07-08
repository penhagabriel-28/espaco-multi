import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  try {
    const { data: ags } = await supabase.from("agendamentos").select("id, status, data_inicio");
    const julyAgs = ags.filter(a => a.data_inicio >= "2026-07-01T00:00:00" && a.data_inicio <= "2026-07-31T23:59:59");
    console.log(`Total July ags: ${julyAgs.length}`);
    const nonPending = julyAgs.filter(a => a.status !== "pendente");
    console.log(`Non-pending July ags count: ${nonPending.length}`);
    console.log("Sample non-pending July ags:", nonPending);
  } catch (err) {
    console.error(err);
  }
}

check();
