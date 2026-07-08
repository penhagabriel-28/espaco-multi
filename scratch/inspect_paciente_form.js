import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\components\\PacienteFormDialog.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('semana_toda') || line.includes('apoio_frequencia') || line.includes('avulso') || line.includes('1x') || line.includes('3x')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
