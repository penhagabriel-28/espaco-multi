import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase
    .from('agendamentos')
    .select('id')
    .limit(1);

  if (error) {
    console.error(error);
    return;
  }
  
  // Since we don't have custom SQL runner in JS easily unless we use RPC or inspect schema,
  // let's try calling RPCs or query Postgres information_schema via a PostgREST hack if possible.
  // Actually, let's see if we can do an RPC call. Supabase JS has no default SQL editor, but sometimes developers define custom RPCs.
  // Let's check what RPCs are available, or let's check if there are other tables we can query.
  // Let's try querying a few possible backup/temp tables:
  const possibleTables = [
    'agendamentos_backup',
    'agendamentos_old',
    'agendamentos_copy',
    'backup_agendamentos',
    'faturas_backup',
    'faturas_old'
  ];
  
  for (const table of possibleTables) {
    const { data: tblData, error: tblError } = await supabase.from(table).select('count');
    if (!tblError) {
      console.log(`Table ${table} exists! Row count:`, tblData);
    } else {
      // console.log(`Table ${table} check failed:`, tblError.message);
    }
  }
  
  console.log("Done checking tables.");
}

check();
