import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.diretoria.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('valor_personalizado') || line.includes('apoio_valor_personalizado') || line.includes('customVal') || line.includes('valor') && line.includes('fatura')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
