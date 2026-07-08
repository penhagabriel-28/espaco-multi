import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  console.log("Fetching all database triggers from PostgreSQL...");
  
  // We can run a query against pg_trigger to find triggers and their functions
  const { data, error } = await supabase.rpc('get_triggers'); // wait, if get_triggers RPC doesn't exist, we query pg_catalog via REST hack if possible or just use a select.
  // Wait, is there a way to query triggers?
  // Let's check if we can select from pg_trigger or pg_proc.
  // Actually, we can run a select on public tables or check the migration folder.
  // Let's check all migration files in supabase/migrations to see if there is any other file we didn't search.
  const files = fs.readdirSync('supabase/migrations');
  console.log("Migration files:");
  files.forEach(f => {
    const content = fs.readFileSync(`supabase/migrations/${f}`, 'utf-8');
    if (content.toLowerCase().includes('trigger')) {
      console.log(`- ${f} has triggers`);
      // Find trigger names
      const lines = content.split('\n');
      lines.forEach((l, idx) => {
        if (l.toLowerCase().includes('trigger')) {
          console.log(`  [${idx+1}] ${l.trim()}`);
        }
      });
    }
  });
}

check();
