import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function run() {
  const { data: faturas } = await supabase
    .from("faturas")
    .select("id, competencia, status")
    .gte("competencia", "2026-06-01")
    .lte("competencia", "2026-06-30");

  console.log("Faturas in June 2026:", faturas?.length);
}

run();
