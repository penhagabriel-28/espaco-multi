import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://peafjcreckbtjuzfcrld.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYWZqY3JlY2tidGp1emZjcmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTgxMzMsImV4cCI6MjA5NzI3NDEzM30.U8eXNP3kaPgD0OGOTwmr8ZIVZApb-G8eMXDXksIch_E";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCounts() {
  const tables = ['pacientes', 'profissionais', 'servicos', 'salas', 'agendamentos', 'faturas', 'fatura_itens', 'despesas', 'responsaveis'];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error for ${table}:`, error.message);
    } else {
      console.log(`${table}: ${count} rows`);
    }
  }
}

checkCounts();
