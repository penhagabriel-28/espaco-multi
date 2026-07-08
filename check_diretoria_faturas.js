import fs from 'fs';

function check() {
  const content = fs.readFileSync('src/routes/_app.diretoria.tsx', 'utf-8');
  const lines = content.split('\n');
  console.log("Searching for 'fatura' in diretoria route:");
  
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('fatura') || line.toLowerCase().includes('cobrança') || line.toLowerCase().includes('apoio')) {
      console.log(`Line ${idx + 1}: ${line.trim().slice(0, 100)}`);
    }
  });
}

check();
