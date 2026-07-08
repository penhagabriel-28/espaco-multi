import fs from 'fs';

function check() {
  const content = fs.readFileSync('supabase/consolidated_migration.sql', 'utf-8');
  const lines = content.split('\n');
  console.log("Searching for triggers/functions on fatura_itens in consolidated migration:");
  
  lines.forEach((line, idx) => {
    if (line.includes('TRIGGER') && (line.includes('fatura_itens') || line.includes('itens'))) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
      for (let i = -10; i <= 10; i++) {
        console.log(`  [${idx + i + 1}] ${lines[idx + i]}`);
      }
    }
  });
}

check();
