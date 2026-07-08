import fs from 'fs';
import path from 'path';

function findFiles(dir, ext) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== '.lovable' && file !== '.vercel') {
          results = results.concat(findFiles(fullPath, ext));
        }
      } else {
        if (file.endsWith(ext)) {
          results.push(fullPath);
        }
      }
    });
  } catch (e) {}
  return results;
}

const files = findFiles('C:\\Users\\Windows 10\\Desktop\\Robozinho Integrar', '.json');
console.log('JSON files in Integrar:', files);
