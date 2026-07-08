import fs from 'fs';
import path from 'path';

const dir = 'c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\supabase\\migrations';
fs.readdirSync(dir).forEach(f => {
  if (f.endsWith('.sql')) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    if (content.includes('TRIGGER') || content.includes('trigger')) {
      console.log(`Trigger mentioned in: ${f}`);
      const lines = content.split(/\r?\n/);
      lines.forEach((line, idx) => {
        if (line.includes('CREATE TRIGGER') || line.includes('ON agendamentos')) {
          console.log(`  ${idx + 1}: ${line}`);
        }
      });
    }
  }
});
