import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\components\\PacienteFormDialog.tsx', 'utf8');
const lines = content.split(/\r?\n/);
const startIdx = lines.findIndex(l => l.includes('const handleSubmit =') || l.includes('mutationFn:'));
if (startIdx !== -1) {
  for (let i = startIdx; i < startIdx + 120; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
