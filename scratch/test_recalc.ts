import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.VITE_SUPABASE_URL || '', env.VITE_SUPABASE_PUBLISHABLE_KEY || '');

async function run() {
  const juliaId = "f623c1dc-70b2-409f-913f-c21fb7456342";
  const competencia = "2026-06-01";

  console.log("Recalculating...");
  const { data: rpcRes, error: rpcErr } = await supabase.rpc("fn_recalculate_apoio_package", {
    p_paciente_id: juliaId,
    p_competencia: competencia,
  });

  if (rpcErr) {
    console.error("RPC Error:", rpcErr);
    return;
  }
  console.log("RPC call success:", rpcRes);

  // Fetch fatura and items again
  const { data: faturas } = await supabase.from('faturas').select('*').eq('paciente_id', juliaId);
  console.log('\nFaturas:');
  console.log(JSON.stringify(faturas, null, 2));

  const { data: items } = await supabase.from('fatura_itens').select('*').eq('fatura_id', 'f89dec0d-6188-4d79-a31c-87814efc5ec6');
  console.log('\nFatura Items:');
  console.log(JSON.stringify(items, null, 2));
}

run();
