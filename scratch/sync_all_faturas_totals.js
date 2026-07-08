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
  console.log('Fetching all faturas...');
  const { data: faturas, error: fatsErr } = await supabase.from('faturas').select('*');
  if (fatsErr) {
    console.error('Error fetching faturas:', fatsErr);
    return;
  }

  console.log(`Found ${faturas.length} faturas. Recalculating totals...`);

  for (const f of faturas) {
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

    if (Number(f.valor) !== sum) {
      console.log(`Fatura ${f.id} (Competence: ${f.competencia}, Patient: ${f.paciente_id}, Status: ${f.status}): Current valor: ${f.valor}, Recalculated sum: ${sum}. Updating...`);
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

  console.log('Invoice totals synchronization complete.');
}

run();
