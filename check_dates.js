import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('id, data_inicio, status, assinatura_responsavel')
    .gte('data_inicio', '2026-06-01T00:00:00')
    .lte('data_inicio', '2026-06-30T23:59:59');

  if (error) {
    console.error(error);
    return;
  }

  console.log('June 2026 total appointments:', data.length);
  const statusCounts = {};
  const signedStatusCounts = {};
  
  data.forEach(a => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    if (a.assinatura_responsavel) {
      signedStatusCounts[a.status] = (signedStatusCounts[a.status] || 0) + 1;
    }
  });

  console.log('June 2026 status counts:', statusCounts);
  console.log('June 2026 signed status counts:', signedStatusCounts);
}

check();
