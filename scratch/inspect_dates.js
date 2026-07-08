import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.diretoria.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('const [inicio') || line.includes('const [fim') || line.includes('setInicio') || line.includes('setFim')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
