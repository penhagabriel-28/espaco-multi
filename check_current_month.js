import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  const { data: profs } = await supabase.from('profissionais').select('id, nome');
  const inicio = "2026-06-01";
  const fim = "2026-06-30";

  console.log(`Querying for range: ${inicio}T00:00:00 to ${fim}T23:59:59\n`);

  for (const p of (profs || [])) {
    const { data: ags, error } = await supabase
      .from("agendamentos")
      .select("id, status, data_inicio, assinatura_responsavel, nome_assinante")
      .eq("profissional_id", p.id)
      .gte("data_inicio", `${inicio}T00:00:00`)
      .lte("data_inicio", `${fim}T23:59:59`);

    if (error) {
      console.error(`Error for ${p.nome}:`, error);
      continue;
    }

    if (ags.length > 0) {
      console.log(`Professional: ${p.nome} - Total in June: ${ags.length}`);
      const signed = ags.filter(a => a.assinatura_responsavel);
      const unsigned = ags.filter(a => !a.assinatura_responsavel);
      console.log(`  Signed: ${signed.length}`);
      console.log(`  Unsigned: ${unsigned.length}`);
      const statusCounts = {};
      unsigned.forEach(a => {
        statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
      });
      console.log(`  Unsigned by status:`, statusCounts);
    }
  }
}

check();
