import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function runForceRealizado() {
  try {
    console.log("Fetching past pending appointments between June 18 and July 6...");
    const { data: ags, error: fetchErr } = await supabase
      .from("agendamentos")
      .select("id, data_inicio, status")
      .eq("status", "pendente")
      .gte("data_inicio", "2026-06-18T00:00:00")
      .lte("data_inicio", "2026-07-06T23:59:59");

    if (fetchErr) throw fetchErr;

    console.log(`Found ${ags.length} past pending appointments.`);
    if (ags.length === 0) {
      console.log("No appointments to update.");
      return;
    }

    console.log("Updating their statuses to 'realizado'...");
    
    // We update them in batches to avoid network congestion and trigger overhead
    const batchSize = 10;
    for (let i = 0; i < ags.length; i += batchSize) {
      const batch = ags.slice(i, i + batchSize);
      const batchIds = batch.map(a => a.id);
      
      console.log(`Updating batch ${i / batchSize + 1}/${Math.ceil(ags.length / batchSize)}...`);
      const { error: updateErr } = await supabase
        .from("agendamentos")
        .update({ status: "realizado" })
        .in("id", batchIds);
      
      if (updateErr) {
        console.error(`Error updating batch:`, updateErr.message);
      } else {
        console.log(`Successfully updated batch.`);
      }
    }

    console.log("All past pending appointments have been marked as 'realizado'!");

  } catch (err) {
    console.error(err);
  }
}

runForceRealizado();
