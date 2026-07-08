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
      if (content.includes('120.00') || content.includes('240.00') || content.includes('360.00') || content.includes('450.00')) {
        console.log(`Found hardcoded price in: ${fullPath}`);
        const lines = content.split(/\r?\n/);
        lines.forEach((line, idx) => {
          if (line.includes('120') || line.includes('240') || line.includes('360') || line.includes('450')) {
            console.log(`  ${idx + 1}: ${line}`);
          }
        });
      }
    }
  });
}

searchFiles('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src');
