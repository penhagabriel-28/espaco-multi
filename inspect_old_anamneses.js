import { createClient } from "@supabase/supabase-js";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const supabase = createClient(oldUrl, oldKey);

async function check() {
  const { count, error } = await supabase.from("anamneses").select("*", { count: "exact", head: true });
  if (error) {
    console.log("Error for anamneses:", error.message);
  } else {
    console.log("Anamneses in old DB:", count);
  }
}

check();
