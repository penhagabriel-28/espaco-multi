import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.agenda.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('syncAgendamentoFinanceiro')) {
    console.log(`${idx + 1}: ${line}`);
    // Print next 5 lines
    for (let i = 1; i <= 10; i++) {
      if (lines[idx + i]) console.log(`  +${i}: ${lines[idx + i]}`);
    }
  }
});
