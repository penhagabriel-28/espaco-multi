import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data: profs } = await supabase.from('profissionais').select('id, nome');
  const { data: ags, error } = await supabase
    .from('agendamentos')
    .select('id, status, data_inicio, profissional_id, assinatura_responsavel, nome_assinante');

  if (error) {
    console.error(error);
    return;
  }

  const profMap = {};
  (profs || []).forEach(p => { profMap[p.id] = p.nome; });

  const profStats = {};
  ags.forEach(a => {
    const profName = profMap[a.profissional_id] || 'Unknown';
    if (!profStats[profName]) {
      profStats[profName] = {
        total: 0,
        signed: 0,
        unsigned: 0,
        byStatus: {}
      };
    }
    const stats = profStats[profName];
    stats.total++;
    if (a.assinatura_responsavel) {
      stats.signed++;
    } else {
      stats.unsigned++;
    }
    stats.byStatus[a.status] = (stats.byStatus[a.status] || 0) + 1;
  });

  console.log("Stats per Professional:");
  console.log(JSON.stringify(profStats, null, 2));
}

check();
