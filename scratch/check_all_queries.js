import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://peafjcreckbtjuzfcrld.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYWZqY3JlY2tidGp1emZjcmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTgxMzMsImV4cCI6MjA5NzI3NDEzM30.U8eXNP3kaPgD0OGOTwmr8ZIVZApb-G8eMXDXksIch_E";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAll() {
  console.log("1. Querying pacientes...");
  const { data: pacs, error: pacsErr } = await supabase.from('pacientes').select('*').order('nome');
  if (pacsErr) console.error("Pacientes failed:", pacsErr);
  else console.log(`Pacientes success: ${pacs.length} rows`);

  console.log("2. Querying profissionais...");
  const { data: profs, error: profsErr } = await supabase.from('profissionais').select('id, nome, cor, especialidade, valor_sessao, valores_config').eq('ativo', true).order('nome');
  if (profsErr) console.error("Profissionais failed:", profsErr);
  else console.log(`Profissionais success: ${profs.length} rows`);

  console.log("3. Querying servicos...");
  const { data: servs, error: servsErr } = await supabase.from('servicos').select('id, nome, duracao_minutos').eq('ativo', true).order('nome');
  if (servsErr) console.error("Servicos failed:", servsErr);
  else console.log(`Servicos success: ${servs.length} rows`);

  console.log("4. Querying salas...");
  const { data: salas, error: salasErr } = await supabase.from('salas').select('*').order('nome');
  if (salasErr) console.error("Salas failed:", salasErr);
  else console.log(`Salas success: ${salas.length} rows`);
}

testAll();
