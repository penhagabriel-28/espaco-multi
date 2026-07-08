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
    console.log("Fetching all old agendamentos...");
    const oldAgs = await fetchAll(oldSupabase, "agendamentos", "id, status, data_inicio, paciente_id");
    console.log("Fetching all new agendamentos...");
    const newAgs = await fetchAll(newSupabase, "agendamentos", "id, status, data_inicio, paciente_id, assinatura_responsavel");

    console.log(`Old agendamentos count: ${oldAgs.length}`);
    console.log(`New agendamentos count: ${newAgs.length}`);

    const oldMap = new Map(oldAgs.map(a => [a.id, a]));
    const newMap = new Map(newAgs.map(a => [a.id, a]));

    let inOldNotNew = 0;
    let inNewNotOld = 0;
    let statusDiff = 0;
    let sameStatus = 0;

    oldAgs.forEach(a => {
      if (!newMap.has(a.id)) {
        inOldNotNew++;
      } else {
        const newAg = newMap.get(a.id);
        if (newAg.status !== a.status) {
          statusDiff++;
        } else {
          sameStatus++;
        }
      }
    });

    newAgs.forEach(a => {
      if (!oldMap.has(a.id)) {
        inNewNotOld++;
      }
    });

    console.log(`In Old but not New: ${inOldNotNew}`);
    console.log(`In New but not Old: ${inNewNotOld}`);
    console.log(`Status differs: ${statusDiff}`);
    console.log(`Status is same: ${sameStatus}`);

    const newNotOldSample = newAgs.filter(a => !oldMap.has(a.id));
    console.log(`Sample of agendamentos in New but not Old (Total: ${newNotOldSample.length}):`);
    newNotOldSample.slice(0, 15).forEach(a => {
      console.log(`- ID: ${a.id}, Date: ${a.data_inicio}, Status: ${a.status}, Signed: ${!!a.assinatura_responsavel}`);
    });
  } catch (err) {
    console.error("Error in compare:", err);
  }
}

compare();
