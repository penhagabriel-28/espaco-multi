import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.agenda.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (idx >= 1400 && idx <= 1550) {
    if (line.includes('const valor') || line.includes('let valor') || line.includes('valor =') || line.includes('getPricing')) {
      console.log(`${idx + 1}: ${line}`);
    }
  }
});
