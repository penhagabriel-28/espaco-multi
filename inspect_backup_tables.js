import fs from "fs";

function inspect() {
  if (!fs.existsSync("backup_data.json")) {
    console.error("backup_data.json not found");
    return;
  }
  const data = JSON.parse(fs.readFileSync("backup_data.json", "utf8"));
  console.log("=== BACKUP DATA TABLES ===");
  for (const table of Object.keys(data)) {
    console.log(`${table}: ${data[table].length} rows`);
  }
}

inspect();
