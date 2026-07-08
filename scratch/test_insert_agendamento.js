import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://peafjcreckbtjuzfcrld.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYWZqY3JlY2tidGp1emZjcmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTgxMzMsImV4cCI6MjA5NzI3NDEzM30.U8eXNP3kaPgD0OGOTwmr8ZIVZApb-G8eMXDXksIch_E";

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("1. Finding a patient and professional to use...");
  const { data: patients } = await supabase.from('pacientes').select('id').limit(1);
  const { data: professionals } = await supabase.from('profissionais').select('id').limit(1);
  const { data: services } = await supabase.from('servicos').select('id').limit(1);

  if (!patients?.length || !professionals?.length || !services?.length) {
    console.error("Could not find patient, professional or service to test.");
    return;
  }

  const patientId = patients[0].id;
  const professionalId = professionals[0].id;
  const serviceId = services[0].id;

  console.log(`Using Patient: ${patientId}, Prof: ${professionalId}, Service: ${serviceId}`);

  console.log("2. Inserting a dummy agendamento to test trigger...");
  const dummy = {
    paciente_id: patientId,
    profissional_id: professionalId,
    servico_id: serviceId,
    data_inicio: new Date().toISOString(),
    data_fim: new Date(Date.now() + 60*60*1000).toISOString(),
    status: 'pendente',
    recorrencia: 'unica'
  };

  const { data: inserted, error: insertError } = await supabase
    .from('agendamentos')
    .insert(dummy)
    .select()
    .single();

  if (insertError) {
    console.error("INSERT FAILED WITH ERROR:", insertError);
  } else {
    console.log("INSERT SUCCEEDED! Inserted ID:", inserted.id);

    console.log("3. Updating the agendamento status to 'realizado'...");
    const { data: updated, error: updateError } = await supabase
      .from('agendamentos')
      .update({ status: 'realizado' })
      .eq('id', inserted.id)
      .select()
      .single();

    if (updateError) {
      console.error("UPDATE FAILED WITH ERROR:", updateError);
    } else {
      console.log("UPDATE SUCCEEDED!");
    }

    console.log("4. Cleaning up the test agendamento...");
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
