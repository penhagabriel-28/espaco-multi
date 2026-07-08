import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  const inicio = "2026-06-01";
  const fim = "2026-06-30";

  // Simulate current query
  const queryValStart = `${inicio}T00:00:00`;
  const queryValEnd = `${fim}T23:59:59`;

  const { data: currentQueryAgs } = await supabase
    .from("agendamentos")
    .select("id, data_inicio")
    .gte("data_inicio", queryValStart)
    .lte("data_inicio", queryValEnd);

  // Simulate correct timezone query (using client local time converted to UTC ISO)
  // Let's assume the user is in America/Sao_Paulo (GMT-3)
  // June 1st 00:00:00 GMT-3 is June 1st 03:00:00 UTC
  // June 30th 23:59:59 GMT-3 is July 1st 02:59:59 UTC
  const startUtc = new Date(`${inicio}T00:00:00`).toISOString();
  const endUtc = new Date(`${fim}T23:59:59`).toISOString();

  const { data: tzQueryAgs } = await supabase
    .from("agendamentos")
    .select("id, data_inicio")
    .gte("data_inicio", startUtc)
    .lte("data_inicio", endUtc);

  console.log(`Current query bounds: ${queryValStart} to ${queryValEnd}`);
  console.log(`Current query count: ${currentQueryAgs?.length}`);
  
  console.log(`Timezone-aware bounds: ${startUtc} to ${endUtc}`);
  console.log(`Timezone-aware count: ${tzQueryAgs?.length}`);

  // Find if any are in tzQueryAgs but not in currentQueryAgs
  const currentIds = new Set((currentQueryAgs || []).map(a => a.id));
  const diff = (tzQueryAgs || []).filter(a => !currentIds.has(a.id));

  console.log(`\nDiff count (sessions missed by current query): ${diff.length}`);
  diff.forEach(a => {
    console.log(`Missed Appointment: ID ${a.id}, data_inicio ${a.data_inicio}`);
  });
}

check();
