import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  const months = ["2026-05", "2026-06", "2026-07"];
  
  for (const m of months) {
    const [year, month] = m.split("-");
    const firstDay = `${m}-01`;
    const lastDayStr = new Date(year, month, 0).getDate();
    const lastDay = `${m}-${lastDayStr}`;

    const queryValStart = `${firstDay}T00:00:00`;
    const queryValEnd = `${lastDay}T23:59:59`;

    const { data: currentQueryAgs } = await supabase
      .from("agendamentos")
      .select("id, data_inicio")
      .gte("data_inicio", queryValStart)
      .lte("data_inicio", queryValEnd);

    const startUtc = new Date(`${firstDay}T00:00:00`).toISOString();
    const endUtc = new Date(`${lastDay}T23:59:59`).toISOString();

    const { data: tzQueryAgs } = await supabase
      .from("agendamentos")
      .select("id, data_inicio")
      .gte("data_inicio", startUtc)
      .lte("data_inicio", endUtc);

    const currentIds = new Set((currentQueryAgs || []).map(a => a.id));
    const diff = (tzQueryAgs || []).filter(a => !currentIds.has(a.id));

    console.log(`Month ${m}:`);
    console.log(`  Current query count: ${currentQueryAgs?.length}`);
    console.log(`  Timezone-aware count: ${tzQueryAgs?.length}`);
    console.log(`  Missed: ${diff.length}`);
    if (diff.length > 0) {
      diff.forEach(a => console.log(`    - ID: ${a.id}, Date: ${a.data_inicio}`));
    }
  }
}

check();
