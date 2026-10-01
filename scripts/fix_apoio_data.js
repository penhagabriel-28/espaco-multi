import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="([^"]+)"/) || env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/);
const supabase = createClient(url, key[1]);

const PROFS = {
  Acioniza: 'a522d5be-32b1-48eb-ab79-521cc8f1aa7f',
  Cleide: '0636d39b-c497-4363-911c-03f4285a6dbb',
  Joana: '07a598dc-419c-4df8-b936-a1e5be22d383',
  Rayelle: '130fce50-6dd8-4c29-a7ce-817218a071ea',
};

const PATIENTS_CONFIG = [
  // Acioniza
  {
    search: 'Arthur Fernando Pinto Ulloa Soto',
    freq: '1x',
    valor: 120.00,
    profId: PROFS.Acioniza,
    desc: 'Pacote Apoio - 1x por semana'
  },
  {
    search: 'Júlia Rica Carvalho de Brito',
    freq: '3x_510',
    valor: 510.00,
    profId: PROFS.Acioniza,
    desc: 'Pacote Apoio - 3x por semana (R$ 510,00)'
  },
  {
    search: 'Lorenzo Braga Serra',
    freq: 'semana_toda_600',
    valor: 600.00,
    profId: [PROFS.Acioniza, PROFS.Joana],
    desc: 'Pacote Apoio - Semana Inteira (R$ 600,00)'
  },
  {
    search: 'Luiz Henrique de Matos',
    freq: '2x_252',
    valor: 252.00,
    profId: PROFS.Acioniza,
    desc: 'Pacote Apoio - 2x por semana (R$ 252,00)'
  },
  {
    search: 'Pedro Rafael de O. Sodré',
    freq: '3x_250',
    valor: 250.00,
    profId: PROFS.Acioniza,
    desc: 'Pacote Apoio - 3x por semana (R$ 250,00)'
  },

  // Cleide
  {
    search: 'Ana Pérola Oliveira de Jesus',
    freq: '2x_280',
    valor: 280.00,
    profId: PROFS.Cleide,
    desc: 'Pacote Apoio - 2x por semana (R$ 280,00)'
  },
  {
    search: 'Luís Victor Abreu do Nascimento',
    freq: '3x_400',
    valor: 400.00,
    profId: PROFS.Cleide,
    desc: 'Pacote Apoio - 3x por semana (R$ 400,00)'
  },

  // Joana
  {
    search: 'Deivid Emanuel Ferreira de Sousa',
    freq: 'semana_toda_500',
    valor: 500.00,
    profId: PROFS.Joana,
    desc: 'Pacote Apoio - Semana Inteira (R$ 500,00)'
  },
  {
    search: 'Maria Isabelly Fonseca dos Santos',
    freq: '2x_280',
    valor: 280.00,
    profId: PROFS.Joana,
    desc: 'Pacote Apoio - 2x por semana (R$ 280,00)'
  },
  {
    search: 'Phillipe Emanuel Corrêa Soares',
    freq: '3x',
    valor: 360.00,
    profId: PROFS.Joana,
    desc: 'Pacote Apoio - 3x por semana'
  },
  {
    search: 'Théo Felipe Oliveira Barros',
    freq: '2x_280',
    valor: 280.00,
    profId: PROFS.Joana,
    desc: 'Pacote Apoio - 2x por semana (R$ 280,00)'
  },

  // Rayelle
  {
    search: 'Giannis Miguel Silva Cantanhede Nunes',
    freq: '2x_280',
    valor: 280.00,
    profId: PROFS.Rayelle,
    desc: 'Pacote Apoio - 2x por semana (R$ 280,00)'
  },
];

async function run() {
  console.log('--- INICIANDO ATUALIZAÇÃO DOS PLANOS DO APOIO ---');

  for (const cfg of PATIENTS_CONFIG) {
    const { data: foundPacs } = await supabase
      .from('pacientes')
      .select('*')
      .ilike('nome', `%${cfg.search.split(' ')[0]}%${cfg.search.split(' ')[1]}%`);
    
    const p = foundPacs?.[0];
    if (!p) {
      console.error(`Paciente NÃO encontrado: ${cfg.search}`);
      continue;
    }

    console.log(`\nAtualizando paciente: ${p.nome} (${p.id})`);
    console.log(`  -> Nova Frequência: ${cfg.freq}`);
    console.log(`  -> Novo Valor Mensal: R$ ${cfg.valor.toFixed(2)}`);

    // 1. Update patient in pacientes table
    const { error: updErr } = await supabase
      .from('pacientes')
      .update({
        apoio_frequencia: cfg.freq,
        apoio_valor_personalizado: cfg.valor,
      })
      .eq('id', p.id);

    if (updErr) {
      console.error(`  Erro ao atualizar paciente:`, updErr);
      continue;
    }
    console.log(`  [OK] Registro de paciente atualizado.`);

    // 2. Ensure professional link in paciente_profissional
    const profIds = Array.isArray(cfg.profId) ? cfg.profId : [cfg.profId];
    for (const prId of profIds) {
      const { data: existingPP } = await supabase
        .from('paciente_profissional')
        .select('*')
        .eq('paciente_id', p.id)
        .eq('profissional_id', prId);

      if (!existingPP || existingPP.length === 0) {
        await supabase.from('paciente_profissional').insert({
          paciente_id: p.id,
          profissional_id: prId
        });
        console.log(`  [OK] Vinculado profissional ${prId} ao paciente.`);
      }
    }

    // 3. Find Apoio faturas for this patient to fix bloated amounts
    const { data: faturas } = await supabase
      .from('faturas')
      .select('*')
      .eq('paciente_id', p.id)
      .ilike('especialidade', '%Apoio%');

    for (const f of faturas || []) {
      // If the invoice is 'aberta' (or bloated 'paga'), fix the package item and invoice value
      const { data: items } = await supabase
        .from('fatura_itens')
        .select('*')
        .eq('fatura_id', f.id);

      const pkgItem = items?.find(it => !it.agendamento_id && (it.descricao?.includes('Pacote Apoio') || it.descricao?.includes('Apoio')));
      
      if (f.status === 'aberta' || (f.status === 'paga' && Number(f.valor) > cfg.valor * 1.5)) {
        console.log(`  Corrigindo fatura ${f.id} (comp: ${f.competencia}, valor antigo: ${f.valor} -> novo: ${cfg.valor})`);
        
        await supabase
          .from('faturas')
          .update({ valor: cfg.valor })
          .eq('id', f.id);

        if (pkgItem) {
          await supabase
            .from('fatura_itens')
            .update({
              descricao: cfg.desc,
              valor_unitario: cfg.valor,
              total: cfg.valor,
            })
            .eq('id', pkgItem.id);
          console.log(`    [OK] Item ${pkgItem.id} atualizado para ${cfg.desc} (${cfg.valor}).`);
        } else {
          // If no package item exists, insert one
          await supabase
            .from('fatura_itens')
            .insert({
              fatura_id: f.id,
              descricao: cfg.desc,
              quantidade: 1,
              valor_unitario: cfg.valor,
              total: cfg.valor,
            });
          console.log(`    [OK] Item de pacote criado: ${cfg.desc} (${cfg.valor}).`);
        }
      }
    }
  }

  console.log('\n--- ATUALIZAÇÃO CONCLUÍDA COM SUCESSO! ---');
}

run();
