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
    const oldFats = await fetchAll(oldSupabase, "faturas", "id, status, competencia, valor, paciente_id");
    const newFats = await fetchAll(newSupabase, "faturas", "id, status, competencia, valor, paciente_id");

    const oldPaid = oldFats.filter(f => f.status === "paga");
    const newPaid = newFats.filter(f => f.status === "paga");

    console.log(`Old database: ${oldPaid.length} paid faturas.`);
    console.log(`New database: ${newPaid.length} paid faturas.`);

    const { data: pacs } = await newSupabase.from("pacientes").select("id, nome");
    const pacMap = new Map(pacs.map(p => [p.id, p.nome]));

    console.log("\n=== PAID FATURAS IN OLD DB ===");
    oldPaid.forEach((f, idx) => {
      const pacName = pacMap.get(f.paciente_id) || f.paciente_id;
      console.log(`${idx + 1}. ID: ${f.id}, Patient: ${pacName}, Month: ${f.competencia}, Value: ${f.valor}`);
    });

    console.log("\n=== PAID FATURAS IN NEW DB ===");
    newPaid.forEach((f, idx) => {
      const pacName = pacMap.get(f.paciente_id) || f.paciente_id;
      console.log(`${idx + 1}. ID: ${f.id}, Patient: ${pacName}, Month: ${f.competencia}, Value: ${f.valor}`);
    });

  } catch (err) {
    console.error(err);
  }
}

compare();
