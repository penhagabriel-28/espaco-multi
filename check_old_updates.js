import { createClient } from "@supabase/supabase-js";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const oldSupabase = createClient(oldUrl, oldKey);

async function check() {
  try {
    const { data, error } = await oldSupabase
      .from("agendamentos")
      .select("id, status, data_inicio, updated_at")
      .order("updated_at", { ascending: false })
      .limit(20);
    
    if (error) throw error;

    console.log("=== MOST RECENTLY UPDATED AGENDAMENTOS IN OLD DB ===");
    data.forEach(a => {
      console.log(`ID: ${a.id}, Status: ${a.status}, Date: ${a.data_inicio}, Updated At: ${a.updated_at}`);
    });
  } catch (err) {
    console.error(err);
  }
}

check();
