import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.agenda.tsx', 'utf8');
const lines = content.split(/\r?\n/);
let inDialog = false;
let braceCount = 0;

lines.forEach((line, idx) => {
  if (line.includes('function AgendamentoDialog')) {
    inDialog = true;
    console.log(`--- Start of AgendamentoDialog at line ${idx + 1} ---`);
  }
  if (inDialog) {
    if (line.includes('useQuery') || line.includes('supabase.from')) {
      console.log(`${idx + 1}: ${line}`);
    }
    if (line.includes('function ') || line.includes('const ') && line.includes('=>') && !line.includes('useQuery')) {
      // just to print boundary helper
    }
  }
});
