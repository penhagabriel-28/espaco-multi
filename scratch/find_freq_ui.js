import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== '.gemini' && f !== 'scratch') {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

walkDir('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('semana_toda') || content.includes('apoio_frequencia')) {
      console.log(`Found in: ${filePath}`);
    }
  }
});
