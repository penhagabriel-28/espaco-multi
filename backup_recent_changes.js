import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function fetchAll(table) {
  let allData = [];
  let from = 0;
  let to = 999;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .range(from, to)
      .order('id');
    
    if (error) {
      throw error;
    }
    allData.push(...data);
    if (data.length < 1000) break;
    from += 1000;
    to += 1000;
  }
  return allData;
}

async function runBackup() {
  try {
    const cutoffDate = "2026-07-06T00:00:00.000Z";
    console.log(`Backing up changes created or updated since ${cutoffDate}...`);

    // 1. Fetch patients
    const pacs = await fetchAll("pacientes");
    const recentPacs = pacs.filter(p => p.created_at >= cutoffDate || p.updated_at >= cutoffDate);
    console.log(`Patients to backup: ${recentPacs.length}`);

    // 2. Fetch appointments
    const ags = await fetchAll("agendamentos");
    const recentAgs = ags.filter(a => 
      a.created_at >= cutoffDate || 
      a.updated_at >= cutoffDate || 
      a.assinatura_responsavel !== null ||
      (a.data_inicio >= "2026-07-01T00:00:00" && a.status !== "pendente")
    );
    console.log(`Appointments to backup: ${recentAgs.length} (including signed ones)`);

    // 3. Fetch faturas
    const fats = await fetchAll("faturas");
    const recentFats = fats.filter(f => f.created_at >= cutoffDate || f.updated_at >= cutoffDate);
    console.log(`Faturas to backup: ${recentFats.length}`);

    // 4. Fetch fatura_itens
    const items = await fetchAll("fatura_itens");
    const recentItems = items.filter(i => i.created_at >= cutoffDate);
    console.log(`Fatura itens to backup: ${recentItems.length}`);

    // 5. Fetch despesas
    const desps = await fetchAll("despesas");
    const recentDesps = desps.filter(d => d.created_at >= cutoffDate || d.updated_at >= cutoffDate);
    console.log(`Despesas to backup: ${recentDesps.length}`);

    // 6. Fetch professionals
    const profs = await fetchAll("profissionais");
    const recentProfs = profs.filter(p => p.created_at >= cutoffDate || p.updated_at >= cutoffDate);
    console.log(`Professionals to backup: ${recentProfs.length}`);

    const backupData = {
      pacientes: recentPacs,
      agendamentos: recentAgs,
      faturas: recentFats,
      fatura_itens: recentItems,
      despesas: recentDesps,
      profissionais: recentProfs
    };

    fs.writeFileSync("recent_changes_backup.json", JSON.stringify(backupData, null, 2));
    console.log("Recent changes backup saved to recent_changes_backup.json!");

  } catch (err) {
    console.error(err);
  }
}

runBackup();
