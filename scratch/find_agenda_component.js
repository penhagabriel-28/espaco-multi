import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.agenda.tsx', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('function Agenda') || line.includes('const Agenda') || line.includes('export default') || line.includes('function Page') || line.includes('function RouteComponent')) {
    console.log(`${idx + 1}: ${line}`);
  }
});
