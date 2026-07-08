import fs from 'fs';

try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const keys = envContent.split('\n').map(line => {
    const parts = line.split('=');
    return parts[0].trim();
  }).filter(Boolean);
  
  console.log('Environment variable keys found in .env:', keys);
} catch (err) {
  console.error('Error reading .env:', err);
}
