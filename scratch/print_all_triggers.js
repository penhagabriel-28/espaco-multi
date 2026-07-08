import fs from 'fs';
import path from 'path';

const dir = 'c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\supabase\\migrations';
fs.readdirSync(dir).forEach(f => {
  if (f.endsWith('.sql')) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    const matches = content.match(/CREATE\s+TRIGGER\s+\w+/gi);
    if (matches) {
      console.log(`Found in ${f}:`);
      matches.forEach(m => console.log(`  ${m}`));
    }
  }
});
