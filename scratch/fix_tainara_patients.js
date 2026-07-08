import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
    env[key] = val;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL || '', env.VITE_SUPABASE_PUBLISHABLE_KEY || '');

async function run() {
  console.log('Fetching patients...');
  const { data: patients } = await supabase.from('pacientes').select('id, nome');
  
  const dominic = patients.find(p => p.nome.toLowerCase().includes('dominic'));
  const juliana = patients.find(p => p.nome.toLowerCase().includes('juliana') && p.nome.toLowerCase().includes('vieira'));

  if (!dominic || !juliana) {
    console.error('Patients not found!');
    return;
  }

  const pIds = [dominic.id, juliana.id];

  // Fetch all July 2026 agendamentos with status in ('realizado', 'pago', 'falta')
  const { data: ags, error: agsError } = await supabase
    .from('agendamentos')
    .select('*')
    .in('paciente_id', pIds)
    .in('status', ['realizado', 'pago', 'falta']);

  if (agsError) {
    console.error('Error fetching agendamentos:', agsError);
    return;
  }

  console.log(`Found ${ags.length} billed agendamentos to update.`);

  for (const a of ags) {
    console.log(`Updating agendamento ${a.id} for patient ${a.paciente_id} with current status: ${a.status}`);
    const { data, error } = await supabase
      .from('agendamentos')
      .update({ status: a.status })
      .eq('id', a.id)
      .select();
    
    if (error) {
      console.error(`Error updating agendamento ${a.id}:`, error);
    } else {
      console.log(`Successfully updated agendamento ${a.id}.`);
    }
  }

  console.log('\n--- DIRECTLY SYNCING FATURA TOTAL VALUES ---');
  // Fetch all faturas for these patients
  const { data: fats, error: fatsErr } = await supabase
    .from('faturas')
    .select('*')
    .in('paciente_id', pIds);

  if (fatsErr) {
    console.error('Error fetching faturas:', fatsErr);
    return;
  }

  for (const f of fats) {
    // Get sum of its items
    const { data: items, error: itemsErr } = await supabase
      .from('fatura_itens')
      .select('total')
      .eq('fatura_id', f.id);

    if (itemsErr) {
      console.error(`Error fetching items for fatura ${f.id}:`, itemsErr);
      continue;
    }

    const sum = (items || []).reduce((acc, item) => acc + Number(item.total || 0), 0);
    console.log(`Fatura ${f.id} (Competence: ${f.competencia}, Patient: ${f.paciente_id}): Current valor: ${f.valor}, Calculated sum of items: ${sum}`);

    if (f.valor !== sum) {
      console.log(`Updating fatura ${f.id} valor to ${sum}...`);
      const { error: updateErr } = await supabase
        .from('faturas')
        .update({ valor: sum })
        .eq('id', f.id);
      
      if (updateErr) {
        console.error(`Error updating fatura ${f.id}:`, updateErr);
      } else {
        console.log(`Successfully updated fatura ${f.id} to ${sum}.`);
      }
    }
  }

  // Double check the fatura items values now
  console.log('\n--- FINAL VERIFICATION ---');
  const { data: finalItems } = await supabase
    .from('fatura_itens')
    .select('id, fatura_id, descricao, valor_unitario, total, faturas!inner(paciente_id, competencia)')
    .in('faturas.paciente_id', pIds)
    .eq('faturas.competencia', '2026-07-01');

  console.log('July 2026 Fatura Items:', finalItems);

  const { data: finalFaturas } = await supabase
    .from('faturas')
    .select('id, paciente_id, competencia, valor, status')
    .in('paciente_id', pIds)
    .eq('competencia', '2026-07-01');

  console.log('July 2026 Faturas:', finalFaturas);
}

run();
