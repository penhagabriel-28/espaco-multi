import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  try {
    const tables = [
      "pacientes", "profissionais", "servicos", "salas", "agendamentos", 
      "faturas", "fatura_itens", "despesas", "paciente_profissional",
      "frequencias", "assinaturas", "documentos", "supervisores"
    ];

    console.log("=== TABLE ROW COUNTS IN NEW DB ===");
    for (const t of tables) {
      const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
      if (error) {
        console.log(`Table ${t}: Error - ${error.message}`);
      } else {
        console.log(`Table ${t}: ${count} rows`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

check();
