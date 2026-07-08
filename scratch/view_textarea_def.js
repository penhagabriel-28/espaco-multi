import fs from 'fs';
if (fs.existsSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\components\\ui\\textarea.tsx')) {
  console.log(fs.readFileSync('c:\\Users\\Samsung\\Desktop\\Robozinho Multi2\\Robozinho Multi\\espaco-multi\\src\\components\\ui\\textarea.tsx', 'utf8'));
} else {
  console.log("No textarea.tsx found in components/ui");
}
