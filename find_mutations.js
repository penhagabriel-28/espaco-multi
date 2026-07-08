import fs from 'fs';

const content = fs.readFileSync('src/routes/_app.agenda.tsx', 'utf8');
const lines = content.split('\n');

console.log("Searching for useMutation in _app.agenda.tsx:");
lines.forEach((line, i) => {
  if (line.includes('useMutation') || line.includes('update') || line.includes('save') || line.includes('.from("agendamentos")') || line.includes('.from(\'agendamentos\')')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
});
