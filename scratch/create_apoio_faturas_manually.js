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
  { name: 'Ana Pérola Oliveira de Jesus', freq: '2x', value: 240, freqLabel: 'Pacote Apoio - 2x por semana', profName: 'Cleide' },
  { name: 'Arthur Fernando Pinto Ulloa Soto', freq: '1x', value: 120, freqLabel: 'Pacote Apoio - 1x por semana', profName: 'Acioniza Ferreira' },
  { name: 'Deivid Emanuel Ferreira de Sousa', freq: 'semana_toda', value: 500, freqLabel: 'Pacote Apoio - Semana Inteira', profName: 'Tainara Martins' },
  { name: 'Júlia Rica Carvalho de Brito', freq: '3x', value: 510, freqLabel: 'Pacote Apoio - 3x por semana', profName: 'Acioniza Ferreira' },
  { name: 'Lorenzo Braga Serra', freq: '3x', value: 400, freqLabel: 'Pacote Apoio - 3x por semana', profName: 'Acioniza Ferreira' },
  { name: 'Luís Victor Abreu do Nascimento', freq: '3x', value: 360, freqLabel: 'Pacote Apoio - 3x por semana', profName: 'Cleide' },
  { name: 'Luiz Henrique de Matos', freq: '3x', value: 360, freqLabel: 'Pacote Apoio - 3x por semana', profName: 'Acioniza Ferreira' },
  { name: 'Maria Isabelly Fonseca dos Santos', freq: '2x', value: 280, freqLabel: 'Pacote Apoio - 2x por semana', profName: 'Danielle' },
  { name: 'Pedro Rafael de O. Sodré', freq: '3x', value: 300, freqLabel: 'Pacote Apoio - 3x por semana', profName: 'Acioniza Ferreira' },
  { name: 'Phillipe Emanuel Corrêa Soares', freq: 'semana_toda', value: 360, freqLabel: 'Pacote Apoio - Semana Inteira', profName: 'Dailson' },
  { name: 'Théo Felipe Oliveira Barros', freq: '2x', value: 280, freqLabel: 'Pacote Apoio - 2x por semana', profName: 'Danielle' },
  { name: 'Valentina', freq: '2x', value: 240, freqLabel: 'Pacote Apoio - 2x por semana', profName: 'Danielle' }
];

async function run() {
  console.log('Fetching professionals and patients...');
  const { data: profs } = await supabase.from('profissionais').select('id, nome');
  const { data: patients } = await supabase.from('pacientes').select('id, nome');

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

    console.log(`\nProcessing July fatura for ${p.nome}...`);

    // 3. Find existing fatura
    const { data: existingFaturas } = await supabase
      .from('faturas')
      .select('*')
      .eq('paciente_id', p.id)
      .eq('competencia', '2026-07-01')
      .eq('especialidade', 'Apoio');

    let faturaId;

    if (existingFaturas && existingFaturas.length > 0) {
      const fat = existingFaturas[0];
      faturaId = fat.id;
      
      // Update value and professional
      const { error: updateErr } = await supabase
        .from('faturas')
        .update({
          valor: item.value,
          profissional_id: prof.id
        })
        .eq('id', fat.id);

      if (updateErr) {
        console.error(`- Error updating fatura ${fat.id}:`, updateErr.message);
      } else {
        console.log(`- Updated existing fatura ${fat.id} with value R$ ${item.value} and professional ${item.profName}.`);
      }
    } else {
      // Create new fatura
      const { data: newFat, error: createErr } = await supabase
        .from('faturas')
        .insert({
          paciente_id: p.id,
          competencia: '2026-07-01',
          valor: item.value,
          status: 'aberta',
          especialidade: 'Apoio',
          profissional_id: prof.id
        })
        .select()
        .single();

      if (createErr) {
        console.error(`- Error creating fatura:`, createErr.message);
        continue;
      }

      faturaId = newFat.id;
      console.log(`- Created new fatura ${faturaId} with value R$ ${item.value} and professional ${item.profName}.`);
    }

    // 4. Find or create package item
    const { data: existingItems } = await supabase
      .from('fatura_itens')
      .select('*')
      .eq('fatura_id', faturaId)
      .is('agendamento_id', null);

    const packageItem = existingItems?.find(it => it.descricao.startsWith('Pacote Apoio') || it.descricao === 'Pacote Apoio');

    if (packageItem) {
      // Update item
      const { error: itemUpdateErr } = await supabase
        .from('fatura_itens')
        .update({
          descricao: item.freqLabel,
          valor_unitario: item.value,
          total: item.value
        })
        .eq('id', packageItem.id);

      if (itemUpdateErr) {
        console.error(`- Error updating fatura item ${packageItem.id}:`, itemUpdateErr.message);
      } else {
        console.log(`- Updated existing package item ${packageItem.id} to "${item.freqLabel}" and value R$ ${item.value}.`);
      }
    } else {
      // Create package item
      const { error: itemCreateErr } = await supabase
        .from('fatura_itens')
        .insert({
          fatura_id: faturaId,
          descricao: item.freqLabel,
          quantidade: 1,
          valor_unitario: item.value,
          total: item.value
        });

      if (itemCreateErr) {
        console.error(`- Error creating package item:`, itemCreateErr.message);
      } else {
        console.log(`- Created package item "${item.freqLabel}" with value R$ ${item.value}.`);
      }
    }

    // 5. Zero out individual sessions for Apoio if any
    const { data: sessionItems } = await supabase
      .from('fatura_itens')
      .select('*')
      .eq('fatura_id', faturaId)
      .not('agendamento_id', 'is', null);

    if (sessionItems && sessionItems.length > 0) {
      for (const sItem of sessionItems) {
        if (sItem.total !== 0 || sItem.valor_unitario !== 0) {
          const { error: zeroErr } = await supabase
            .from('fatura_itens')
            .update({
              valor_unitario: 0,
              total: 0
            })
            .eq('id', sItem.id);
          if (zeroErr) {
            console.error(`- Error zeroing out session item ${sItem.id}:`, zeroErr.message);
          } else {
            console.log(`- Zeroed out session item ${sItem.id} (${sItem.descricao}).`);
          }
        }
      }
    }
  }

  console.log('\nAll July faturas processed successfully!');
}

run();
