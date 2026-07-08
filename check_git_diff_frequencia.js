import { execSync } from 'child_process';

function check() {
  try {
    const diff = execSync('git log -p -n 5 src/routes/_app.frequencia.tsx', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    console.log("Git log diff output size:", diff.length);
    // Let's search for changes to "from(" or "filter" or "status" in the diff
    const lines = diff.split('\n');
    lines.forEach((line, idx) => {
      if (line.startsWith('@@') || line.startsWith('commit ') || line.startsWith('Author:') || line.startsWith('Date:')) {
        console.log(line);
      }
      if (line.startsWith('+') || line.startsWith('-')) {
        if (line.includes('.from') || line.includes('status') || line.includes('filter') || line.includes('select') || line.includes('assinatura')) {
          console.log(`  ${line}`);
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
}

check();
