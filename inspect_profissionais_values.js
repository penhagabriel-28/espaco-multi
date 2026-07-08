import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function inspect() {
  try {
    const { data: profs, error } = await supabase.from("profissionais").select("id, nome, valor_sessao, valores_config");
    if (error) throw error;
    console.log("=== PROFISSIONAIS IN NEW DB ===");
    profs.forEach(p => {
      console.log(`- Name: ${p.nome}, Session Value: ${p.valor_sessao}, Config:`, JSON.stringify(p.valores_config));
    });
  } catch (err) {
    console.error(err);
  }
}

inspect();
