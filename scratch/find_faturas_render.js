import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.diretoria.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (idx >= 3600 && idx <= 3900) {
    if (line.includes('f.valor') || line.includes('brl(') || line.includes('total') || line.includes('item.total')) {
      console.log(`${idx + 1}: ${line}`);
    }
  }
});
