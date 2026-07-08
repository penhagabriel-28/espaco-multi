import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const env = fs.readFileSync(".env", "utf-8");
const newUrl = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const newKey = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const oldSupabase = createClient(oldUrl, oldKey);
const newSupabase = createClient(newUrl, newKey);

async function check() {
  try {
    const { data: oldPacs } = await oldSupabase.from("pacientes").select("id, nome, status");
    const { data: newPacs } = await newSupabase.from("pacientes").select("id, nome, status");

    const newPacMap = new Map(newPacs.map(p => [p.id, p]));

    console.log("=== PATIENT STATUS DIFFS ===");
    let count = 0;
    oldPacs.forEach(op => {
      const np = newPacMap.get(op.id);
      if (np) {
        if (op.status !== np.status) {
          console.log(`Patient: "${op.nome}", Old Status: "${op.status}" -> New Status: "${np.status}"`);
          count++;
        }
      }
    });
    console.log(`Total patient status differences: ${count}`);
  } catch (err) {
    console.error(err);
  }
}

check();
