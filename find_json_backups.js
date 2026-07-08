import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next' && file !== '.vercel' && file !== '.lovable') {
        results = results.concat(walk(fullPath));
      }
    } else if (file.endsWith('.json')) {
      results.push({ path: fullPath, size: stat.size, mtime: stat.mtime });
    }
  });
  return results;
}

const allJson = walk('c:\\Users\\Windows 10\\Desktop\\Robozinho Multi2\\Robozinho Multi');
console.log("JSON Files found:", allJson);
