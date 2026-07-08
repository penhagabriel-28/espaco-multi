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
    const oldPacs = await fetchAll(oldSupabase, "pacientes", "id, nome");
    const newPacs = await fetchAll(newSupabase, "pacientes", "id, nome");

    const newPacMapById = new Map(newPacs.map(p => [p.id, p.nome]));
    const newPacMapByName = new Map(newPacs.map(p => [p.nome.trim().toLowerCase(), p.id]));

    console.log("Checking if old patient IDs exist in new database...");
    let missingIds = 0;
    let matchingIds = 0;
    let differingIds = 0;

    oldPacs.forEach(p => {
      const newName = newPacMapById.get(p.id);
      if (newName) {
        if (newName.trim().toLowerCase() === p.nome.trim().toLowerCase()) {
          matchingIds++;
        } else {
          console.log(`ID ${p.id} matches different names: Old "${p.nome}" vs New "${newName}"`);
          differingIds++;
        }
      } else {
        const newIdForName = newPacMapByName.get(p.nome.trim().toLowerCase());
        console.log(`Old Patient "${p.nome}" (Old ID: ${p.id}) has NEW ID in new DB: ${newIdForName}`);
        missingIds++;
      }
    });

    console.log(`Matching IDs: ${matchingIds}`);
    console.log(`Differing names for same ID: ${differingIds}`);
    console.log(`Missing/Changed IDs: ${missingIds}`);

  } catch (err) {
    console.error(err);
  }
}

compare();
