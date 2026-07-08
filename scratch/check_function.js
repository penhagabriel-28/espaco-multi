import { createClient } from '@supabase/supabase-js';
import fs from 'utf-8';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];
const supabase = createClient(url, key);

async function checkFunc() {
  const { data, error } = await supabase.rpc('inspect_function_definition', { func_name: 'fn_get_especialidade' });
  if (error) {
    // If inspect_function_definition doesn't exist, let's query it via postgres system catalogs if possible, 
    // or try to read migration files. Let's do a search for the function definition in migrations first or query pg_proc.
    console.log("RPC failed:", error.message);
    
    // Let's write a query using a temporary RPC if we can't query pg_catalog directly.
    // Wait, let's see if we can search the codebase for 'fn_get_especialidade'.
  } else {
    console.log(data);
  }
}

checkFunc();
