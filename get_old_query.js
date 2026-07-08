import { execSync } from 'child_process';

try {
  const content = execSync('git show f59804c:src/routes/_app.frequencia.tsx', { encoding: 'utf8' });
  const lines = content.split('\n');
  console.log("Printing lines 180 to 230 of old _app.frequencia.tsx:");
  for (let i = 180; i < 230; i++) {
    if (lines[i]) {
      console.log(`${i + 1}: ${lines[i]}`);
    }
  }
} catch (err) {
  console.error(err);
}
