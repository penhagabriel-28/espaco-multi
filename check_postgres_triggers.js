import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  try {
    const { data, error } = await supabase.rpc("get_triggers");
    if (error) {
      console.log("RPC get_triggers failed:", error.message);
      // Let's try raw REST query on pg_catalog or query public tables
    } else {
      console.log("Triggers:", data);
    }
  } catch (err) {
    console.error(err);
  }
}

check();
