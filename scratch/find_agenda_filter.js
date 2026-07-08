import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.agenda.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('filter') || line.includes('Filter') || line.includes('filtrar') || line.includes('Filtrar')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
