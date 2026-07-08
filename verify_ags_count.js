import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function verify() {
  try {
    const { count, error } = await supabase.from("agendamentos").select("*", { count: "exact", head: true });
    if (error) throw error;
    console.log(`Total agendamentos in new DB now: ${count}`);

    // Check specific future appointments of Adryan and Luan
    const { data: pacs } = await supabase.from("pacientes").select("id, nome").in("nome", ["Adryan Ravy Silva Fonseca ", "Luan Marcelo Pereira Souza"]);
    const pacIds = pacs.map(p => p.id);

    const { data: ags, error: agsErr } = await supabase
      .from("agendamentos")
      .select("id, paciente_id, data_inicio, status")
      .in("paciente_id", pacIds)
      .gt("data_inicio", "2026-07-08T00:00:00");
    
    if (agsErr) throw agsErr;

    console.log(`Found ${ags.length} future appointments for Adryan & Luan:`);
    const pacMap = new Map(pacs.map(p => [p.id, p.nome]));
    ags.forEach((a, idx) => {
      console.log(`${idx + 1}. Patient: ${pacMap.get(a.paciente_id)}, Date: ${a.data_inicio}, Status: ${a.status}`);
    });

  } catch (err) {
    console.error(err);
  }
}

verify();
