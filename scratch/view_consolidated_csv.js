import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.relatorios.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('downloadConsolidatedCSV') || line.includes('downloadSessionCSV')) {
    console.log(`Line ${idx + 1}: ${line}`);
    for (let i = 1; i <= 35; i++) {
      console.log(`  +${i}: ${lines[idx + i]}`);
    }
  }
});
