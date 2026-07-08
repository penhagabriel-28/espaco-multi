import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\supabase\\migrations\\20260629120000_add_apoio_frequencia.sql', 'utf8');
const lines = content.split(/\r?\n/);
const startIdx = lines.findIndex(l => l.includes('CREATE OR REPLACE FUNCTION public.fn_recalculate_apoio_package'));
if (startIdx !== -1) {
  for (let i = startIdx; i < startIdx + 110; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
