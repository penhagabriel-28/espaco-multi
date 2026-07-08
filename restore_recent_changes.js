import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function runRestore() {
  try {
    if (!fs.existsSync("recent_changes_backup.json")) {
      console.error("recent_changes_backup.json not found!");
      return;
    }
    const backupData = JSON.parse(fs.readFileSync("recent_changes_backup.json", "utf-8"));
    console.log("Restoring recent changes from backup...");

    // Logical order: professionals -> patients -> appointments -> faturas -> items -> despesas
    const tables = ["profissionais", "pacientes", "agendamentos", "faturas", "fatura_itens", "despesas"];

    for (const table of tables) {
      const records = backupData[table] || [];
      if (records.length === 0) {
        console.log(`No records to restore for table: ${table}`);
        continue;
      }

      console.log(`Restoring ${records.length} records to ${table}...`);
      
      // We nullify created_by for agendamentos to prevent auth users foreign key error
      const cleanedRecords = records.map(r => {
        if (table === "agendamentos" && r.created_by) {
          return { ...r, created_by: null };
        }
        return r;
      });

      const batchSize = 50;
      for (let i = 0; i < cleanedRecords.length; i += batchSize) {
        const batch = cleanedRecords.slice(i, i + batchSize);
        const { error } = await supabase.from(table).upsert(batch, { onConflict: "id" });
        if (error) {
          console.error(`Error restoring batch to ${table}:`, error.message);
        } else {
          console.log(`Restored batch ${i / batchSize + 1} (${batch.length} rows) to ${table}.`);
        }
      }
    }

    console.log("Recent changes successfully restored!");

  } catch (err) {
    console.error(err);
  }
}

runRestore();
