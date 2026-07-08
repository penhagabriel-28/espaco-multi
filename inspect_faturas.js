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

async function inspect() {
  try {
    const oldFats = await fetchAll(oldSupabase, "faturas", "id, status, competencia, valor, paciente_id");
    const newFats = await fetchAll(newSupabase, "faturas", "id, status, competencia, valor, paciente_id");

    console.log(`Old faturas count: ${oldFats.length}`);
    console.log(`New faturas count: ${newFats.length}`);

    const oldStatus = {};
    oldFats.forEach(f => {
      const month = f.competencia ? f.competencia.slice(0, 7) : "unknown";
      if (!oldStatus[month]) oldStatus[month] = {};
      oldStatus[month][f.status] = (oldStatus[month][f.status] || 0) + 1;
    });

    const newStatus = {};
    newFats.forEach(f => {
      const month = f.competencia ? f.competencia.slice(0, 7) : "unknown";
      if (!newStatus[month]) newStatus[month] = {};
      newStatus[month][f.status] = (newStatus[month][f.status] || 0) + 1;
    });

    console.log("=== OLD FATURAS BY MONTH ===");
    console.log(JSON.stringify(oldStatus, null, 2));

    console.log("=== NEW FATURAS BY MONTH ===");
    console.log(JSON.stringify(newStatus, null, 2));

  } catch (err) {
    console.error(err);
  }
}

inspect();
