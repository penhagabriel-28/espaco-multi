import fs from 'fs';

function check() {
  const content = fs.readFileSync('src/routes/_app.diretoria.tsx', 'utf-8');
  const lines = content.split('\n');
  console.log("Searching for viewingProfDetail rendering:");
  
  lines.forEach((line, idx) => {
    if (line.includes('viewingProfDetail ?') || line.includes('viewingProfDetail &&') || line.includes('activeDetailedProf')) {
      console.log(`Line ${idx + 1}: ${line.trim().slice(0, 100)}`);
    }
  });
}

check();
