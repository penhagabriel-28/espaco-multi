import { createClient } from "@supabase/supabase-js";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const supabase = createClient(oldUrl, oldKey);

async function check() {
  console.log("Listing columns of agendamentos in OLD database...");
  const { data, error } = await supabase
    .from('agendamentos')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error(error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log("Columns of agendamentos in old DB:", Object.keys(data[0]));
  } else {
    console.log("No rows in old DB agendamentos.");
  }
}

check();
