import { createClient } from "@supabase/supabase-js";

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const supabase = createClient(oldUrl, oldKey);

async function fetchAll(table, fields) {
  let allData = [];
  let from = 0;
  let to = 999;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(fields)
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

async function inspect() {
  try {
    console.log("Fetching all agendamentos from OLD DB...");
    const ags = await fetchAll("agendamentos", "id, status, data_inicio");
    console.log(`Total: ${ags.length}`);

    const byMonthAndStatus = {};
    ags.forEach(a => {
      if (!a.data_inicio) return;
      const month = a.data_inicio.slice(0, 7); // YYYY-MM
      if (!byMonthAndStatus[month]) {
        byMonthAndStatus[month] = {};
      }
      byMonthAndStatus[month][a.status] = (byMonthAndStatus[month][a.status] || 0) + 1;
    });

    console.log("Status count by month in OLD DB:");
    console.log(JSON.stringify(byMonthAndStatus, null, 2));

  } catch (err) {
    console.error(err);
  }
}

inspect();
