import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.agenda.tsx', 'utf8');
const lines = content.split(/\r?\n/);
let inDialog = false;
let startLine = 887; // AgendamentoDialog start line

for (let i = startLine; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('pacientes.find') || line.includes('selectedPaciente')) {
    console.log(`${i + 1}: ${line}`);
  }
}
