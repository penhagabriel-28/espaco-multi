import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\routes\\_app.relatorios.tsx', 'utf8');
const lines = content.split(/\r?\n/);

// Find imports target range
let startImports = -1;
let endImports = -1;
lines.forEach((line, idx) => {
  if (line.includes('import {') && line.includes('CheckCircle2') && startImports === -1) {
    startImports = idx + 1;
  }
  if (line.includes('} from "lucide-react";') && startImports !== -1 && endImports === -1) {
    endImports = idx + 1;
  }
});
console.log(`Lucide imports: ${startImports} to ${endImports}`);

// Find handleSubmit range
let startSubmit = -1;
let endSubmit = -1;
lines.forEach((line, idx) => {
  if (line.includes('const handleSubmit =') && startSubmit === -1) {
    startSubmit = idx + 1;
  }
  if (line.includes('saveMutation.mutate(formData);') && startSubmit !== -1 && endSubmit === -1) {
    endSubmit = idx + 3; // up to };
  }
});
console.log(`handleSubmit: ${startSubmit} to ${endSubmit}`);

// Find TabsList range
let startTabsList = -1;
let endTabsList = -1;
lines.forEach((line, idx) => {
  if (line.includes('<TabsList') && startTabsList === -1) {
    startTabsList = idx + 1;
  }
  if (line.includes('</TabsList>') && startTabsList !== -1 && endTabsList === -1) {
    endTabsList = idx + 1;
  }
});
console.log(`TabsList: ${startTabsList} to ${endTabsList}`);

// Find Tabs end range
let startTabsEnd = -1;
lines.forEach((line, idx) => {
  if (line.trim() === '</Tabs>' && startTabsEnd === -1) {
    startTabsEnd = idx + 1;
  }
});
console.log(`Tabs end: ${startTabsEnd}`);
