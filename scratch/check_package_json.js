import fs from 'fs';
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
console.log('Scripts:', packageJson.scripts);
