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

const supabase = createClient(env.VITE_SUPABASE_URL || '', env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || '');

async function run() {
  console.log('Testing trigger with a test fatura_item...');
  
  // 1. Create a dummy fatura
  const { data: fat, error: fatErr } = await supabase
    .from('faturas')
    .insert({
      paciente_id: 'e078abc0-8159-4231-8751-a6ea01a4707e', // Dominic
      competencia: '2026-08-01',
      valor: 0,
      status: 'aberta'
    })
    .select();

  if (fatErr) {
    console.error('Error inserting fatura:', fatErr);
    return;
  }

  const fId = fat[0].id;
  console.log('Created test fatura:', fId, 'current valor:', fat[0].valor);

  // 2. Insert item into fatura_itens
  const { data: item, error: itemErr } = await supabase
    .from('fatura_itens')
    .insert({
      fatura_id: fId,
      descricao: 'Test Item',
      quantidade: 1,
      valor_unitario: 100,
      total: 100
    })
    .select();

  if (itemErr) {
    console.error('Error inserting fatura_item:', itemErr);
    // Cleanup
    await supabase.from('faturas').delete().eq('id', fId);
    return;
  }

  console.log('Inserted test item:', item[0].id, 'total:', item[0].total);

  // 3. Select fatura again to check if valor is 100
  const { data: fatUpdated, error: fatUpdatedErr } = await supabase
    .from('faturas')
    .select('valor')
    .eq('id', fId);

  console.log('Updated fatura valor:', fatUpdated[0]?.valor, 'error:', fatUpdatedErr);

  // 4. Cleanup
  await supabase.from('fatura_itens').delete().eq('id', item[0].id);
  await supabase.from('faturas').delete().eq('id', fId);
}

run();
