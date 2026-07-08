import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  console.log("Checking triggers on faturas and fatura_itens...");
  // Let's query information_schema.triggers via a simple select or check consolidated migration
  // Since we don't have custom SQL runner, we can check consolidated_migration.sql which contains all triggers!
  const migration = fs.readFileSync('supabase/consolidated_migration.sql', 'utf-8');
  const lines = migration.split('\n');
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('trigger') && (line.toLowerCase().includes('fatura') || line.toLowerCase().includes('item'))) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  });
}

check();
