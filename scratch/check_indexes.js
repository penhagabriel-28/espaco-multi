import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function checkIndexes() {
  const { data, error } = await supabase.rpc('inspect_table_indexes', { table_name: 'fatura_itens' });
  if (error) {
    console.log("RPC failed:", error.message);
    
    // Fallback: Query system tables directly using custom SQL if possible, or print migration files to see if index was created.
    // Let's search the migrations for 'INDEX' and 'fatura_itens'.
  } else {
    console.log("Indexes on fatura_itens:", data);
  }
}

checkIndexes();
