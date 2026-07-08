import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\integrations\\supabase\\types.ts', 'utf8');
const match = content.match(/pacientes:\s*\{[^}]+Row:\s*\{([^}]+)\}/s);
if (match) {
  console.log(match[1]);
} else {
  console.log("Not found with Row");
  const idx = content.indexOf('pacientes:');
  if (idx !== -1) {
    console.log(content.substring(idx, idx + 1000));
  } else {
    console.log("pacientes: not found anywhere");
  }
}
