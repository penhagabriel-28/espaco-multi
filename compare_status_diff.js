import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const env = fs.readFileSync(".env", "utf-8");
const newUrl = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const newKey = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const oldSupabase = createClient(oldUrl, oldKey);
const newSupabase = createClient(newUrl, newKey);

async function fetchAll(supabaseClient, table, fields) {
  let allData = [];
  let from = 0;
  let to = 999;
  while (true) {
    const { data, error } = await supabaseClient
      .from(table)
      .select(fields)
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

async function compare() {
  try {
    const oldAgs = await fetchAll(oldSupabase, "agendamentos", "id, status, data_inicio, paciente_id, profissional_id");
    const newAgs = await fetchAll(newSupabase, "agendamentos", "id, status, data_inicio, paciente_id, profissional_id");

    const oldMap = new Map(oldAgs.map(a => [a.id, a]));
    const newMap = new Map(newAgs.map(a => [a.id, a]));

    const { data: profs } = await newSupabase.from("profissionais").select("id, nome");
    const { data: pacs } = await newSupabase.from("pacientes").select("id, nome");
    const profMap = new Map(profs.map(p => [p.id, p.nome]));
    const pacMap = new Map(pacs.map(p => [p.id, p.nome]));

    console.log("=== STATUS DIFFERENCES ===");
    let diffCount = 0;
    oldAgs.forEach(a => {
      const newAg = newMap.get(a.id);
      if (newAg && newAg.status !== a.status) {
        diffCount++;
        const pacName = pacMap.get(a.paciente_id) || "Unknown Patient";
        const profName = profMap.get(a.profissional_id) || "Unknown Prof";
        console.log(`${diffCount}. Agendamento ID: ${a.id}`);
        console.log(`   Patient: ${pacName}, Prof: ${profName}, Date: ${a.data_inicio}`);
        console.log(`   Old Status: ${a.status} -> New Status: ${newAg.status}`);
      }
    });

    console.log("\n=== IN OLD BUT NOT NEW ===");
    let oldOnlyCount = 0;
    oldAgs.forEach(a => {
      if (!newMap.has(a.id)) {
        oldOnlyCount++;
        const pacName = pacMap.get(a.paciente_id) || "Unknown Patient";
        const profName = profMap.get(a.profissional_id) || "Unknown Prof";
        console.log(`${oldOnlyCount}. Agendamento ID: ${a.id}`);
        console.log(`   Patient: ${pacName}, Prof: ${profName}, Date: ${a.data_inicio}, Status: ${a.status}`);
      }
    });

    console.log("\n=== IN NEW BUT NOT OLD ===");
    let newOnlyCount = 0;
    newAgs.forEach(a => {
      if (!oldMap.has(a.id)) {
        newOnlyCount++;
        const pacName = pacMap.get(a.paciente_id) || "Unknown Patient";
        const profName = profMap.get(a.profissional_id) || "Unknown Prof";
        console.log(`${newOnlyCount}. Agendamento ID: ${a.id}`);
        console.log(`   Patient: ${pacName}, Prof: ${profName}, Date: ${a.data_inicio}, Status: ${a.status}`);
      }
    });

  } catch (err) {
    console.error(err);
  }
}

compare();
