import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function list() {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (error) {
      console.log("Error querying information_schema.tables:", error.message);
      // Try querying information_schema via RPC if we can't do it directly
    } else {
      console.log("Tables in public schema:", data.map(t => t.table_name));
    }
  } catch (err) {
    console.error(err);
  }
}

list();
