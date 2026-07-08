import fs from 'fs';

function extract(startLine, endLine) {
  const content = fs.readFileSync('supabase/consolidated_migration.sql', 'utf-8');
  const lines = content.split('\n');
  for (let i = startLine - 1; i < endLine; i++) {
    if (i >= 0 && i < lines.length) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
}

extract(920, 960);
