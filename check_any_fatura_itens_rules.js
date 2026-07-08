import fs from 'fs';

function check() {
  const content = fs.readFileSync('supabase/consolidated_migration.sql', 'utf-8');
  const lines = content.split('\n');
  console.log("Searching for 'fatura_itens' references in functions in consolidated migration:");
  
  let currentFunc = null;
  let funcLines = [];
  
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes('create or replace function')) {
      currentFunc = line;
      funcLines = [];
    }
    if (currentFunc) {
      funcLines.push(line);
    }
    if (line.toLowerCase().includes('$$') && currentFunc && funcLines.length > 5) {
      // end of function body
      const fullFunc = funcLines.join('\n');
      if (fullFunc.toLowerCase().includes('fatura_itens')) {
        console.log(`\nFound function: ${currentFunc}`);
        console.log(fullFunc.slice(0, 300) + '...');
      }
      currentFunc = null;
    }
  });
}

check();
