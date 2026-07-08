import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.diretoria.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('Mensal') || line.includes('Sessão') || line.includes('mensal') || line.includes('sessao') || line.includes('grupo') || line.includes('group')) {
    if (line.includes('filter') || line.includes('const') || line.includes('let') || line.includes('categor') || line.includes('map')) {
      console.log(`${idx + 1}: ${line}`);
    }
  }
});
