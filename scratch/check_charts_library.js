import fs from 'fs';
const packageJson = JSON.parse(fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\package.json', 'utf8'));
console.log('Dependencies:', packageJson.dependencies);
console.log('DevDependencies:', packageJson.devDependencies);
