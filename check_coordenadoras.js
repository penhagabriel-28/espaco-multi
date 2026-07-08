import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data: profs } = await supabase.from('profissionais').select('id, nome, especialidade, valores_config');
  console.log("All professionals in database:");
  profs.forEach(p => {
    console.log(`- ${p.nome}: Specialty: ${p.especialidade}, config:`, p.valores_config);
  });

  // Let's also check distinct specialties in agendamentos if any
  const { data: ags } = await supabase.from('agendamentos').select('servico_id, servicos(nome)').limit(20);
  console.log("\nSample services from agendamentos:");
  ags.forEach(a => {
    console.log(`- Service:`, a.servicos);
  });
}

check();
