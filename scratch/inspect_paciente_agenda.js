import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.agenda.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('paciente') && (line.includes('query') || line.includes('select') || line.includes('from'))) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
