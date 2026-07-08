import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data: ags, error } = await supabase
    .from('agendamentos')
    .select('status, data_inicio, assinatura_responsavel, nome_assinante, data_assinatura');

  if (error) {
    console.error("Error fetching agendamentos:", error);
    return;
  }

  console.log(`Fetched ${ags.length} agendamentos.`);
  
  const signed = ags.filter(a => a.assinatura_responsavel !== null && a.assinatura_responsavel !== undefined && a.assinatura_responsavel !== "");
  console.log(`Signed count: ${signed.length}`);

  const statusCounts = {};
  ags.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
  });
  console.log("Status counts of all fetched:", statusCounts);

  const signedStatusCounts = {};
  signed.forEach(a => {
    signedStatusCounts[a.status] = (signedStatusCounts[a.status] || 0) + 1;
  });
  console.log("Status counts of signed:", signedStatusCounts);

  const dates = ags.map(a => new Date(a.data_inicio)).filter(d => !isNaN(d));
  if (dates.length > 0) {
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    console.log(`Date range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
  }

  // Check if supabase returned max 1000 records
  if (ags.length === 1000) {
    console.log("Supabase limit reached (1000). Fetching count directly...");
    const { count, error: countError } = await supabase
      .from('agendamentos')
      .select('*', { count: 'exact', head: true });
    if (!countError) {
      console.log(`Total count in database: ${count}`);
    }
  }
}

check();
