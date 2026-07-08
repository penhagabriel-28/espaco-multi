import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
    env[key] = val;
  }
});

const supabase = createClient(env.VITE_SUPABASE_URL || '', env.VITE_SUPABASE_PUBLISHABLE_KEY || '');

async function check() {
  const { data, error } = await supabase.rpc('inspect_function_definition', { func_name: 'fn_recalculate_apoio_package' });
  if (error) {
    console.error('Error calling inspect_function_definition:', error);
  } else {
    console.log('Definition of fn_recalculate_apoio_package:');
    console.log(data);
  }
}

check();
