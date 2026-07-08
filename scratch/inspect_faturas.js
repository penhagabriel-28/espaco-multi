import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://peafjcreckbtjuzfcrld.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYWZqY3JlY2tidGp1emZjcmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTgxMzMsImV4cCI6MjA5NzI3NDEzM30.U8eXNP3kaPgD0OGOTwmr8ZIVZApb-G8eMXDXksIch_E";

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("Fetching all faturas...");
  const { data: faturas, error } = await supabase
    .from('faturas')
    .select('*')
    .order('competencia', { ascending: false });

  if (error) {
    console.error("Error fetching faturas:", error);
    return;
  }

  console.log(`Total faturas in DB: ${faturas.length}`);
  if (faturas.length > 0) {
    console.log("Sample faturas:");
    faturas.slice(0, 15).forEach((f, i) => {
      console.log(`[${i}] ID: ${f.id}, PacienteID: ${f.paciente_id}, Competência: ${f.competencia}, Valor: ${f.valor}, Status: ${f.status}, Especialidade: ${f.especialidade}`);
    });
  }
}

inspect();
