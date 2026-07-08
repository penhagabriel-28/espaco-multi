import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\supabase\\migrations\\20260626170000_apoio_and_coordenadora_rules.sql', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('trigger') || line.toLowerCase().includes('function') && line.toLowerCase().includes('apoio')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
