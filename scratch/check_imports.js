import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.agenda.tsx', 'utf8');
const lines = content.split(/\r?\n/);
for (let i = 0; i < 50; i++) {
  console.log(`${i + 1}: ${lines[i]}`);
}
