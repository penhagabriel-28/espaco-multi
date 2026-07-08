import fs from 'fs';
import path from 'path';

function searchFiles(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== '.gemini' && f !== 'scratch') {
        searchFiles(fullPath);
      }
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('agendamentos') && content.includes('paciente_id') && content.includes('eq("paciente_id"')) {
        console.log(`Potential query in: ${fullPath}`);
        const lines = content.split(/\r?\n/);
        lines.forEach((line, idx) => {
          if (line.includes('from("agendamentos")') || line.includes('eq("paciente_id"') || line.includes('limit(')) {
            console.log(`  ${idx + 1}: ${line}`);
          }
        });
      }
    }
  });
}

searchFiles('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src');
