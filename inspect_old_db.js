import { createClient } from "@supabase/supabase-js";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const supabase = createClient(oldUrl, oldKey);

async function check() {
  console.log("Checking OLD database...");
  
  // Get count of agendamentos
  const { count, error: countError } = await supabase
    .from('agendamentos')
    .select('*', { count: 'exact', head: true });
    
  if (countError) {
    console.error("Error fetching count:", countError);
    return;
  }
  
  console.log(`Total agendamentos in old DB: ${count}`);

  // Fetch all signed agendamentos from the old database (using pagination or filters to get all of them)
  const { data: signed, error: signedError } = await supabase
    .from('agendamentos')
    .select('id, status, data_inicio, profissional_id, assinatura_responsavel, nome_assinante, data_assinatura')
    .not('assinatura_responsavel', 'is', null);

  if (signedError) {
    console.error("Error fetching signed:", signedError);
    return;
  }

  console.log(`Signed agendamentos in old DB: ${signed.length}`);
  
  if (signed.length > 0) {
    console.log("Sample signed from old DB:");
    signed.slice(0, 5).forEach(a => {
      console.log(`- ID: ${a.id}, Status: ${a.status}, Date: ${a.data_inicio}, Signer: ${a.nome_assinante}`);
    });
  }
}

check();
