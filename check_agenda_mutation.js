import fs from 'fs';

function check() {
  const content = fs.readFileSync('src/routes/_app.agenda.tsx', 'utf-8');
  const lines = content.split('\n');
  console.log("Searching for update mutation in agenda route:");
  
  lines.forEach((line, idx) => {
    if (line.includes('update(') || line.includes('upsert(') || line.includes('mutationFn')) {
      if (idx > 1000 && idx < 1600) { // Look in the middle where mutations usually are
        console.log(`Line ${idx + 1}: ${line}`);
        for (let i = 1; i <= 15; i++) {
          if (idx + i < lines.length) {
            console.log(`  [${idx + i + 1}] ${lines[idx + i]}`);
          }
        }
      }
    }
  });
}

check();
