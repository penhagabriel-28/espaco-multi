import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data: profs } = await supabase.from('profissionais').select('id, nome');
  const profMap = {};
  (profs || []).forEach(p => { profMap[p.id] = p.nome; });

  const { data: ags, error } = await supabase
    .from('agendamentos')
    .select('id, status, data_inicio, profissional_id, assinatura_responsavel, nome_assinante')
    .not('assinatura_responsavel', 'is', null);

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${ags.length} signed appointments in database.`);
  
  const byProfAndMonth = {};
  ags.forEach(a => {
    const profName = profMap[a.profissional_id] || a.profissional_id;
    const date = new Date(a.data_inicio);
    const month = date.toISOString().slice(0, 7); // YYYY-MM
    
    if (!byProfAndMonth[profName]) {
      byProfAndMonth[profName] = {};
    }
    byProfAndMonth[profName][month] = (byProfAndMonth[profName][month] || 0) + 1;
  });

  console.log("Signed appointments grouped by professional and month:");
  console.log(JSON.stringify(byProfAndMonth, null, 2));
}

check();
