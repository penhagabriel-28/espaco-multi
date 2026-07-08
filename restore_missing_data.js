import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const env = fs.readFileSync(".env", "utf-8");
const newUrl = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const newKey = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const oldSupabase = createClient(oldUrl, oldKey);
const newSupabase = createClient(newUrl, newKey);

async function fetchAll(supabaseClient, table) {
  let allData = [];
  let from = 0;
  let to = 999;
  while (true) {
    const { data, error } = await supabaseClient
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

async function restore() {
  try {
    console.log("Fetching appointments from old DB...");
    const oldAgs = await fetchAll(oldSupabase, "agendamentos");
    console.log(`Fetched ${oldAgs.length} appointments from old DB.`);

    console.log("Fetching appointments from new DB...");
    const newAgs = await fetchAll(newSupabase, "agendamentos");
    console.log(`Fetched ${newAgs.length} appointments from new DB.`);

    const newAgsMap = new Map(newAgs.map(a => [a.id, a]));

    const missingAgs = oldAgs.filter(a => !newAgsMap.has(a.id)).map(a => {
      return {
        ...a,
        created_by: null
      };
    });
    console.log(`Found ${missingAgs.length} missing appointments.`);

    if (missingAgs.length === 0) {
      console.log("No appointments to restore.");
      return;
    }

    // Fetch patient names for logging
    const { data: pacs } = await newSupabase.from("pacientes").select("id, nome");
    const pacMap = new Map(pacs.map(p => [p.id, p.nome]));

    console.log("Missing appointments to restore:");
    missingAgs.forEach((a, idx) => {
      const pacName = pacMap.get(a.paciente_id) || "Unknown Patient";
      console.log(`${idx + 1}. ID: ${a.id}, Patient: ${pacName}, Date: ${a.data_inicio}`);
    });

    console.log("Restoring missing appointments to new DB...");
    const { data, error } = await newSupabase.from("agendamentos").insert(missingAgs);
    if (error) {
      throw error;
    }
    console.log("Successfully restored missing appointments!");

  } catch (err) {
    console.error("Error during restore:", err);
  }
}

restore();
