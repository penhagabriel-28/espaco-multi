import fs from 'fs';

function check() {
  const content = fs.readFileSync('src/routes/_app.agenda.tsx', 'utf-8');
  const lines = content.split('\n');
  console.log("Searching for 'assinatura' or 'nome_assinante' in agenda route:");
  
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('assinatura') || line.toLowerCase().includes('assinante')) {
      console.log(`Line ${idx + 1}: ${line}`);
      // print 3 lines before and after
      for (let i = -3; i <= 3; i++) {
        if (idx + i >= 0 && idx + i < lines.length && i !== 0) {
          console.log(`  [${idx + i + 1}] ${lines[idx + i]}`);
        }
      }
    }
  });
}

check();
