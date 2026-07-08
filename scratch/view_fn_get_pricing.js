import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\supabase\\migrations\\20260603142200_sync_agendamento_financeiro.sql', 'utf8');
const lines = content.split(/\r?\n/);
const startIdx = lines.findIndex(l => l.includes('CREATE OR REPLACE FUNCTION public.fn_get_pricing'));
if (startIdx !== -1) {
  for (let i = startIdx; i < startIdx + 70; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
