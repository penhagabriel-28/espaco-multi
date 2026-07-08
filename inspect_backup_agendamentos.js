import fs from "fs";

function inspect() {
  if (!fs.existsSync("backup_data.json")) {
    console.error("backup_data.json not found");
    return;
  }
  const data = JSON.parse(fs.readFileSync("backup_data.json", "utf8"));
  if (!data.agendamentos) {
    console.error("No agendamentos in backup");
    return;
  }
  const ags = data.agendamentos;
  const byMonthAndStatus = {};

  ags.forEach(a => {
    if (!a.data_inicio) return;
    const month = a.data_inicio.slice(0, 7); // YYYY-MM
    if (!byMonthAndStatus[month]) {
      byMonthAndStatus[month] = {};
    }
    byMonthAndStatus[month][a.status] = (byMonthAndStatus[month][a.status] || 0) + 1;
  });

  console.log("=== BACKUP AGENDAMENTOS BY MONTH ===");
  console.log(JSON.stringify(byMonthAndStatus, null, 2));
}

inspect();
