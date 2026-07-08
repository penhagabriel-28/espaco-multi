import fs from 'fs';

function inspect() {
  if (!fs.existsSync("backup_data.json")) {
    console.error("backup_data.json not found!");
    return;
  }

  const data = JSON.parse(fs.readFileSync("backup_data.json", "utf8"));
  console.log("Keys in backup_data.json:");
  for (const key of Object.keys(data)) {
    console.log(`- ${key}: ${Array.isArray(data[key]) ? data[key].length : typeof data[key]} records`);
  }
}

inspect();
