import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://peafjcreckbtjuzfcrld.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYWZqY3JlY2tidGp1emZjcmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTgxMzMsImV4cCI6MjA5NzI3NDEzM30.U8eXNP3kaPgD0OGOTwmr8ZIVZApb-G8eMXDXksIch_E";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("1. Finding a patient, professional, and 'Apoio' or general service to use...");
  const { data: patients } = await supabase.from('pacientes').select('id').limit(1);
  const { data: professionals } = await supabase.from('profissionais').select('id').limit(1);
  const { data: services } = await supabase.from('servicos').select('id, nome').limit(5);

  if (!patients?.length || !professionals?.length || !services?.length) {
    console.error("Could not find required entities.");
    return;
  }

  const patientId = patients[0].id;
  const professionalId = professionals[0].id;
  
  // Find or use service
  const service = services.find(s => s.nome?.toLowerCase().includes("apoio")) || services[0];
  const serviceId = service.id;

  console.log(`Using Patient: ${patientId}, Prof: ${professionalId}, Service: ${service.nome} (${serviceId})`);

  console.log("2. Inserting a dummy 'Apoio' agendamento...");
  const dummy = {
    paciente_id: patientId,
    profissional_id: professionalId,
    servico_id: serviceId,
    data_inicio: new Date().toISOString(),
    data_fim: new Date(Date.now() + 60*60*1000).toISOString(),
    status: 'realizado', // Should trigger calculation
    recorrencia: 'unica'
  };

  const { data: inserted, error: insertError } = await supabase
    .from('agendamentos')
    .insert(dummy)
    .select()
    .single();

  if (insertError) {
    console.error("INSERT APOIO FAILED WITH ERROR:", insertError);
  } else {
    console.log("INSERT APOIO SUCCEEDED! Inserted ID:", inserted.id);

    console.log("3. Cleaning up the test agendamento...");
    const { error: deleteError } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', inserted.id);

    if (deleteError) {
      console.error("DELETE FAILED WITH ERROR:", deleteError);
    } else {
      console.log("DELETE SUCCEEDED! Cleanup complete.");
    }
  }
}

runTest();
