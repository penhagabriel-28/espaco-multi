import fs from "fs";

function inspect() {
  const p = "C:\\Users\\Windows 10\\Desktop\\Robozinho Integrar\\Integrar\\backup_data.json";
  if (!fs.existsSync(p)) {
    console.log("No file found.");
    return;
  }
  const stat = fs.statSync(p);
  console.log(`File size: ${stat.size} bytes`);
  console.log(`Last modified: ${stat.mtime.toISOString()}`);
  
  const data = JSON.parse(fs.readFileSync(p, "utf-8"));
  console.log("=== TABLES ===");
  for (const table of Object.keys(data)) {
    console.log(`${table}: ${data[table].length} rows`);
  }

  if (data.agendamentos) {
    const signed = data.agendamentos.filter(a => a.assinatura_responsavel);
    console.log(`Signed agendamentos in Integrar backup: ${signed.length}`);
    if (signed.length > 0) {
      console.log("Sample signed appointment:", signed[0]);
    }
  }
}

inspect();
