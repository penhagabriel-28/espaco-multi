import fs from 'fs';
import path from 'path';

function findFiles(dir, exts) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== '.lovable' && file !== '.vercel') {
          results = results.concat(findFiles(fullPath, exts));
        }
      } else {
        const ext = path.extname(file).toLowerCase();
        if (exts.includes(ext) || file.includes('backup') || file.includes('restore') || file.includes('sql')) {
          results.push(fullPath);
        }
      }
    });
  } catch (e) {}
  return results;
}

const exts = ['.bak', '.backup', '.sql', '.db', '.sqlite', '.sqlite3'];
const files = findFiles('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2', exts);
console.log('Files found:', files);
