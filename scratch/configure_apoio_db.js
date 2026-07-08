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

const updates = [
  { name: 'Ana Pérola Oliveira de Jesus', freq: '2x', value: 240, profName: 'Cleide' },
  { name: 'Arthur Fernando Pinto Ulloa Soto', freq: '1x', value: 120, profName: 'Acioniza Ferreira' },
  { name: 'Deivid Emanuel Ferreira de Sousa', freq: 'semana_toda', value: 500, profName: 'Tainara Martins' },
  { name: 'Júlia Rica Carvalho de Brito', freq: '3x', value: 510, profName: 'Acioniza Ferreira' },
  { name: 'Lorenzo Braga Serra', freq: '3x', value: 400, profName: 'Acioniza Ferreira' },
  { name: 'Luís Victor Abreu do Nascimento', freq: '3x', value: 360, profName: 'Cleide' },
  { name: 'Luiz Henrique de Matos', freq: '3x', value: 360, profName: 'Acioniza Ferreira' },
  { name: 'Maria Isabelly Fonseca dos Santos', freq: '2x', value: 280, profName: 'Danielle' },
  { name: 'Pedro Rafael de O. Sodré', freq: '3x', value: 300, profName: 'Acioniza Ferreira' },
  { name: 'Phillipe Emanuel Corrêa Soares', freq: 'semana_toda', value: 360, profName: 'Dailson' },
  { name: 'Théo Felipe Oliveira Barros', freq: '2x', value: 280, profName: 'Danielle' },
  { name: 'Valentina', freq: '2x', value: 240, profName: 'Danielle' }
];

async function run() {
  console.log('Fetching professionals and patients...');
  const { data: profs } = await supabase.from('profissionais').select('id, nome');
  const { data: patients } = await supabase.from('pacientes').select('*');

  for (const item of updates) {
    // 1. Find patient
    const p = patients.find(p => p.nome.toLowerCase().includes(item.name.toLowerCase()));
    if (!p) {
      console.error(`Patient NOT found: ${item.name}`);
      continue;
    }

    // 2. Find professional
    const prof = profs.find(pr => pr.nome.toLowerCase().includes(item.profName.toLowerCase()));
    if (!prof) {
      console.error(`Professional NOT found: ${item.profName}`);
      continue;
    }

    console.log(`\nConfiguring ${p.nome} (ID: ${p.id})...`);

    // 3. Update patient CIDs and Apoio config
    let cids = p.cids_secundarios || [];
    if (!cids.some(c => c.toLowerCase() === 'apoio' || c.toUpperCase() === 'AP')) {
      cids.push('Apoio');
    }

    const { error: patErr } = await supabase
      .from('pacientes')
      .update({
        cids_secundarios: cids,
        apoio_frequencia: item.freq,
        apoio_valor_personalizado: item.value
      })
      .eq('id', p.id);

    if (patErr) {
      console.error(`Error updating patient ${p.nome}:`, patErr);
      continue;
    }
    console.log(`- Updated frequency to "${item.freq}", custom value to R$ ${item.value}, and CIDs list.`);

    // 4. Update paciente_profissional link
    const { data: existingLinks } = await supabase
      .from('paciente_profissional')
      .select('*')
      .eq('paciente_id', p.id)
      .eq('profissional_id', prof.id);

    if (!existingLinks || existingLinks.length === 0) {
      const { error: linkErr } = await supabase
        .from('paciente_profissional')
        .insert({
          paciente_id: p.id,
          profissional_id: prof.id
        });
      if (linkErr) {
        console.error(`Error linking ${p.nome} to ${prof.nome}:`, linkErr);
      } else {
        console.log(`- Linked to professional ${prof.nome}.`);
      }
    } else {
      console.log(`- Already linked to professional ${prof.nome}.`);
    }

    // 5. Trigger recalculations
    // For July 2026
    const { error: recalcErrJuly } = await supabase.rpc('fn_recalculate_apoio_package', {
      p_paciente_id: p.id,
      p_competencia: '2026-07-01'
    });
    if (recalcErrJuly) {
      console.error(`- Error recalculating July 2026:`, recalcErrJuly);
    } else {
      console.log(`- Recalculated July 2026 Apoio package invoice.`);
    }

    // For June 2026 (especially for Maria Isabelly and Valentina who had June sessions)
    const { error: recalcErrJune } = await supabase.rpc('fn_recalculate_apoio_package', {
      p_paciente_id: p.id,
      p_competencia: '2026-06-01'
    });
    if (recalcErrJune) {
      console.error(`- Error recalculating June 2026:`, recalcErrJune);
    } else {
      console.log(`- Recalculated June 2026 Apoio package invoice.`);
    }
  }

  console.log('\nAll configurations completed successfully!');
}

run();
