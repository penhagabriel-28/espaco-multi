import fs from 'fs';
import path from 'path';

const dir = 'c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\supabase\\migrations';
fs.readdirSync(dir).forEach(f => {
  if (f.endsWith('.sql')) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    if (content.toLowerCase().includes('index') && content.toLowerCase().includes('fatura_itens')) {
      console.log(`Found index for fatura_itens in: ${f}`);
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes('index') || line.toLowerCase().includes('fatura_itens')) {
          console.log(`  ${idx + 1}: ${line}`);
        }
      });
    }
  }
});
