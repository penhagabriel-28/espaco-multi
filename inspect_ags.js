import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  // Get counts of various columns and values
  const { data: ags, error } = await supabase
    .from('agendamentos')
    .select('status, data_inicio, assinatura_responsavel, nome_assinante, data_assinatura');

  if (error) {
    console.error("Error fetching agendamentos:", error);
    return;
  }

  console.log(`Fetched ${ags.length} agendamentos.`);
  
  // Look for any signed ones
  const signed = ags.filter(a => a.assinatura_responsavel !== null && a.assinatura_responsavel !== undefined);
  console.log(`Signed count (not null): ${signed.length}`);

  // Count by status
  const statusCounts = {};
  ags.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });
  console.log("Status counts:", statusCounts);

  // Date range
  const dates = ags.map(a => new Date(a.data_inicio)).filter(d => !isNaN(d));
  if (dates.length > 0) {
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    console.log(`Date range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
  } else {
    console.log("No valid dates found.");
  }

  // Print first 5 rows to see structure
  console.log("Sample rows:", ags.slice(0, 5));
}

check();
