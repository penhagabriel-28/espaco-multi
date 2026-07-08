import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.diretoria.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('queryKey') || line.includes('from("') || line.includes('select(')) {
    if (line.toLowerCase().includes('fat') || line.toLowerCase().includes('cob') || line.toLowerCase().includes('pag') || line.toLowerCase().includes('pac')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
