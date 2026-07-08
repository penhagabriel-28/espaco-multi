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
    const oldPacs = await fetchAll(oldSupabase, "pacientes", "id, nome, status, data_nascimento");
    const newPacs = await fetchAll(newSupabase, "pacientes", "id, nome, status, data_nascimento");

    console.log(`Old patients count: ${oldPacs.length}`);
    console.log(`New patients count: ${newPacs.length}`);

    const oldMap = new Map(oldPacs.map(p => [p.nome.trim().toLowerCase(), p]));
    const newMap = new Map(newPacs.map(p => [p.nome.trim().toLowerCase(), p]));

    console.log("\n=== PATIENTS IN OLD BUT NOT NEW ===");
    oldPacs.forEach(p => {
      if (!newMap.has(p.nome.trim().toLowerCase())) {
        console.log(`- ID: ${p.id}, Name: "${p.nome}", Status: ${p.status}, Birthday: ${p.data_nascimento}`);
      }
    });

    console.log("\n=== PATIENTS IN NEW BUT NOT OLD ===");
    newPacs.forEach(p => {
      if (!oldMap.has(p.nome.trim().toLowerCase())) {
        console.log(`- ID: ${p.id}, Name: "${p.nome}", Status: ${p.status}, Birthday: ${p.data_nascimento}`);
      }
    });
  } catch (err) {
    console.error(err);
  }
}

compare();
