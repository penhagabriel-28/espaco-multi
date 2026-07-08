import { createClient } from "@supabase/supabase-js";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const supabase = createClient(oldUrl, oldKey);

async function check() {
  const { data: fats, error: fErr } = await supabase.from('faturas').select('*').limit(1);
  if (fErr) console.error("Faturas error:", fErr);
  else if (fats && fats.length > 0) console.log("Faturas columns:", Object.keys(fats[0]));

  const { data: items, error: iErr } = await supabase.from('fatura_itens').select('*').limit(1);
  if (iErr) console.error("Fatura itens error:", iErr);
  else if (items && items.length > 0) console.log("Fatura itens columns:", Object.keys(items[0]));
}

check();
