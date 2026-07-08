import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const env = fs.readFileSync(".env", "utf-8");
const newUrl = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const newKey = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const oldSupabase = createClient(oldUrl, oldKey);
const newSupabase = createClient(newUrl, newKey);

async function fetchAll(supabase, table) {
  let allData = [];
  let from = 0;
  let to = 999;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, to)
      .order('id');
    
    if (error) {
      throw error;
    }
    allData.push(...data);
    if (data.length < 1000) break;
    from += 1000;
    to += 1000;
  }
  return allData;
}

async function check() {
  try {
    const oldAgs = await fetchAll(oldSupabase, "agendamentos");
    const newAgs = await fetchAll(newSupabase, "agendamentos");

    const newAgMap = new Map(newAgs.map(a => [a.id, a]));

    console.log("=== APPOINTMENT STATUS DIFFS (OLD vs NEW) ===");
    let diffCount = 0;
    oldAgs.forEach(oa => {
      const na = newAgMap.get(oa.id);
      if (na) {
        if (oa.status !== na.status) {
          console.log(`Appointment ID: ${oa.id}, Date: ${oa.data_inicio}`);
          console.log(`  Old DB Status: ${oa.status}`);
          console.log(`  New DB Status: ${na.status}`);
          diffCount++;
        }
      }
    });

    console.log(`Total appointment status differences: ${diffCount}`);

  } catch (err) {
    console.error(err);
  }
}

check();
