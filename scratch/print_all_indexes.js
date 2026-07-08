import fs from 'fs';
import path from 'path';

const dir = 'c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\supabase\\migrations';
fs.readdirSync(dir).forEach(f => {
  if (f.endsWith('.sql')) {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    const matches = content.match(/CREATE\s+INDEX\s+\w+\s+ON\s+public\.\w+\([^)]+\)/gi);
    if (matches) {
      console.log(`Found indexes in ${f}:`);
      matches.forEach(m => console.log(`  ${m}`));
    }
  }
});
