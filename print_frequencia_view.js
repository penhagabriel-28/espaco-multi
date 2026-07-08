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
    .select('*, pacientes(nome)')
    .order('data_inicio', { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  const profMap = {};
  (profs || []).forEach(p => { profMap[p.id] = p.nome; });

  console.log("Checking all sessions in DB to see what button they would show:");
  let countSigned = 0;
  let countCancelado = 0;
  let countAssinarBtn = 0;

  ags.forEach(a => {
    const signed = !!a.assinatura_responsavel;
    let buttonType = "";
    if (signed) {
      buttonType = "Assinado por " + a.nome_assinante;
      countSigned++;
    } else if (a.status === "cancelado") {
      buttonType = "Sessão cancelada";
      countCancelado++;
    } else {
      buttonType = "Assinar Digitalmente";
      countAssinarBtn++;
    }
  });

  console.log(`Summary:`);
  console.log(`- Signed: ${countSigned}`);
  console.log(`- Cancelado: ${countCancelado}`);
  console.log(`- Assinar Digitalmente button: ${countAssinarBtn}`);
  console.log(`- Total: ${ags.length}`);
}

check();
