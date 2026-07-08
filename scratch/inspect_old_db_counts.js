import { createClient } from '@supabase/supabase-js';

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const oldSupabase = createClient(oldUrl, oldKey);

async function run() {
  const tables = ['pacientes', 'profissionais', 'servicos', 'salas', 'agendamentos', 'faturas', 'fatura_itens', 'despesas', 'responsaveis'];
  console.log("Checking row counts in old database:");
  for (const table of tables) {
    const { count, error } = await oldSupabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`Error for ${table}:`, error.message);
    } else {
      console.log(`- ${table}: ${count} rows`);
    }
  }
}

run();
