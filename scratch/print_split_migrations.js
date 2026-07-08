import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\supabase\\migrations\\20260626150000_split_faturas_per_session.sql', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('trigger')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
