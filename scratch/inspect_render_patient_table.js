import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.diretoria.tsx', 'utf8');
const lines = content.split(/\r?\n/);
let startLine = -1;
lines.forEach((line, idx) => {
  if (line.includes('const renderPatientTable =')) {
    startLine = idx + 1;
  }
});

if (startLine !== -1) {
  console.log(`Found on line ${startLine}`);
  for (let i = 0; i < 70; i++) {
    console.log(`${startLine + i}: ${lines[startLine + i - 1]}`);
  }
} else {
  console.log("renderPatientTable not found");
}
