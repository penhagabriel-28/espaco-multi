import fs from 'fs';

function check() {
  const content = fs.readFileSync('src/routes/_app.agenda.tsx', 'utf-8');
  const lines = content.split('\n');
  console.log("Searching for syncAgendamentoFinanceiro definition in agenda route:");
  
  lines.forEach((line, idx) => {
    if (line.includes('syncAgendamentoFinanceiro =') || line.includes('function syncAgendamentoFinanceiro')) {
      console.log(`Line ${idx + 1}: ${line}`);
      for (let i = 1; i <= 60; i++) {
        if (idx + i < lines.length) {
          console.log(`  [${idx + i + 1}] ${lines[idx + i]}`);
        }
      }
    }
  });
}

check();
