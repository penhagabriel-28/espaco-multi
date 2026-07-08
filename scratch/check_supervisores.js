import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://peafjcreckbtjuzfcrld.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYWZqY3JlY2tidGp1emZjcmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTgxMzMsImV4cCI6MjA5NzI3NDEzM30.U8eXNP3kaPgD0OGOTwmr8ZIVZApb-G8eMXDXksIch_E";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: profs, error } = await supabase
    .from('profissionais')
    .select('id, nome, especialidade, ativo')
    .eq('ativo', true);

  if (error) {
    console.error(error);
    return;
  }

  console.log("All active professionals and their specialties:");
  profs.forEach(p => {
    console.log(`- ${p.nome}: ${p.especialidade}`);
  });
}

check();
