import fs from 'fs';

function check() {
  const content = fs.readFileSync('src/routes/_app.diretoria.tsx', 'utf-8');
  const lines = content.split('\n');
  console.log("Searching for professional payment code in diretoria route:");
  
  lines.forEach((line, idx) => {
    const l = line.toLowerCase();
    if (l.includes('pagamento') || l.includes('bônus') || l.includes('bonus') || l.includes('comissão') || l.includes('comissao') || l.includes('repasse') || l.includes('valores_config')) {
      if (idx > 1000 && idx < 3000) { // check typical ranges
        console.log(`Line ${idx + 1}: ${line.trim().slice(0, 120)}`);
      }
    }
  });
}

check();
