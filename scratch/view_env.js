import fs from 'fs';
const content = fs.readFileSync('.env', 'utf8');
console.log(content.split('\n').map(line => line.split('=')[0]).join(', '));
