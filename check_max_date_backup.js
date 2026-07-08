import fs from 'fs';

function check() {
  if (!fs.existsSync('backup_data.json')) {
    console.log("No backup_data.json found");
    return;
  }
  const data = JSON.parse(fs.readFileSync('backup_data.json', 'utf-8'));
  if (data.agendamentos) {
    const dates = data.agendamentos.map(a => new Date(a.data_inicio).getTime());
    const maxDate = new Date(Math.max(...dates));
    const minDate = new Date(Math.min(...dates));
    console.log(`Backup date range: ${minDate.toISOString()} to ${maxDate.toISOString()}`);
    console.log(`Total count: ${data.agendamentos.length}`);
  }
}
check();
