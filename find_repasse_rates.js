import fs from 'fs';

function check() {
  const content = fs.readFileSync('src/routes/_app.diretoria.tsx', 'utf-8');
  const lines = content.split('\n');
  console.log("Searching for getRepasseRates in diretoria route:");
  
  lines.forEach((line, idx) => {
    if (line.includes('getRepasseRates')) {
      console.log(`Line ${idx + 1}: ${line}`);
      for (let i = -5; i <= 15; i++) {
        if (idx + i >= 0 && idx + i < lines.length && i !== 0) {
          console.log(`  [${idx + i + 1}] ${lines[idx + i]}`);
        }
      }
    }
  });
}

check();
