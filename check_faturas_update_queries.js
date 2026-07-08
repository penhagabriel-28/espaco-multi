import fs from 'fs';

function check() {
  console.log("Searching for faturas update/insert in agenda and diretoria route:");
  
  const files = ['src/routes/_app.agenda.tsx', 'src/routes/_app.diretoria.tsx', 'supabase/consolidated_migration.sql'];
  
  files.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('faturas') && (line.includes('update') || line.includes('insert') || line.includes('upsert') || line.includes('delete'))) {
        console.log(`[${file}] Line ${idx + 1}: ${line.trim().slice(0, 120)}`);
      }
    });
  });
}

check();
