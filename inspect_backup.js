import fs from 'fs';

async function check() {
  if (!fs.existsSync('backup_data.json')) {
    console.log("No backup_data.json found");
    return;
  }
  const data = JSON.parse(fs.readFileSync('backup_data.json', 'utf-8'));
  console.log("Tables in backup:", Object.keys(data));
  if (data.agendamentos) {
    console.log(`Total appointments in backup: ${data.agendamentos.length}`);
    const signed = data.agendamentos.filter(a => a.assinatura_responsavel);
    console.log(`Signed in backup: ${signed.length}`);
    signed.slice(0, 5).forEach(a => {
      console.log(`ID: ${a.id}, status: ${a.status}, sign: ${a.assinatura_responsavel ? a.assinatura_responsavel.slice(0, 30) : null}`);
    });
  }
}
check();
