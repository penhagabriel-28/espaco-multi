import fs from 'fs';
import path from 'path';

const dir = 'c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\supabase\\migrations';
fs.readdirSync(dir).forEach(f => {
  if (f.endsWith('.sql')) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    if (content.includes('fn_get_especialidade')) {
      console.log(`Found in: ${f}`);
      // Print lines containing it
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (line.includes('fn_get_especialidade') || line.includes('function') && line.includes('especialidade')) {
          console.log(`  ${idx + 1}: ${line}`);
        }
      });
    }
  }
});
