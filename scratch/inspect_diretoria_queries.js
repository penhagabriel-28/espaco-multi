import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.diretoria.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('query') || line.includes('from("') || line.includes('select(') || line.includes('useQuery')) {
    if (line.toLowerCase().includes('fat') || line.toLowerCase().includes('cob') || line.toLowerCase().includes('pag') || line.toLowerCase().includes('pac') || line.toLowerCase().includes('agen')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
