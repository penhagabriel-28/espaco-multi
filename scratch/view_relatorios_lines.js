import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.relatorios.tsx', 'utf8');
const lines = content.split(/\r?\n/);
for (let i = 995; i < 1025; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
