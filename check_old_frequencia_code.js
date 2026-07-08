import { execSync } from 'child_process';

function check() {
  try {
    const content = execSync('git show f59804c:src/routes/_app.frequencia.tsx', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    const lines = content.split('\n');
    console.log("Lines in initial commit of frequencia tab:");
    
    // Find lines around "from(\"agendamentos\")" or "queryFn"
    lines.forEach((line, idx) => {
      if (line.includes('from("agendamentos")') || line.includes('from(\'agendamentos\')') || line.includes('freq-agendamentos')) {
        console.log(`Line ${idx + 1}: ${line}`);
        for (let i = 1; i <= 15; i++) {
          if (idx + i < lines.length) {
            console.log(`Line ${idx + i + 1}: ${lines[idx + i]}`);
          }
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
}

check();
