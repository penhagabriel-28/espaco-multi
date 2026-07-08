import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data: ags, error } = await supabase
    .from('agendamentos')
    .select('id, status, data_inicio, assinatura_responsavel, nome_assinante')
    .not('assinatura_responsavel', 'is', null);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Checking ${ags.length} non-null signatures in DB:`);
  
  let emptyCount = 0;
  let stringNullCount = 0;
  let base64Count = 0;

  ags.forEach(a => {
    const val = a.assinatura_responsavel;
    if (val === "") {
      emptyCount++;
    } else if (val === "null") {
      stringNullCount++;
    } else if (val.startsWith("data:image")) {
      base64Count++;
    } else {
      console.log(`Unknown signature format: ID ${a.id}, val: ${val.slice(0, 50)}`);
    }
  });

  console.log(`Summary:`);
  console.log(`- Empty string: ${emptyCount}`);
  console.log(`- String "null": ${stringNullCount}`);
  console.log(`- Base64 data: ${base64Count}`);
  console.log(`- Total non-null: ${ags.length}`);
}

check();
