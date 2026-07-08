import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\supabase\\migrations\\20260623140000_fatura_itens_integrity.sql', 'utf8');
const lines = content.split(/\r?\n/);
const startIdx = lines.findIndex(l => l.includes('tr_sync_fatura_valor') || l.includes('fn_sync_fatura_valor'));
if (startIdx !== -1) {
  for (let i = startIdx - 50; i < startIdx + 50; i++) {
    if (lines[i] !== undefined) console.log(`${i + 1}: ${lines[i]}`);
  }
} else {
  console.log("Not found by index, printing first 200 lines:");
  for (let i = 0; i < 200; i++) {
    if (lines[i] !== undefined) console.log(`${i + 1}: ${lines[i]}`);
  }
}
