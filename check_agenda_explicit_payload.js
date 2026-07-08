import fs from 'fs';

function check() {
  const content = fs.readFileSync('src/routes/_app.agenda.tsx', 'utf-8');
  const lines = content.split('\n');
  console.log("Searching for explicitPayload in agenda route:");
  
  lines.forEach((line, idx) => {
    if (line.includes('explicitPayload')) {
      console.log(`Line ${idx + 1}: ${line}`);
      for (let i = -5; i <= 5; i++) {
        if (idx + i >= 0 && idx + i < lines.length && i !== 0) {
          console.log(`  [${idx + i + 1}] ${lines[idx + i]}`);
        }
      }
    }
  });
}

check();
