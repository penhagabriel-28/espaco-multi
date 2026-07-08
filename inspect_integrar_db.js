import { createClient } from "@supabase/supabase-js";

const url = "https://sfkejiqyhqzljoumgjxh.supabase.co";
const serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNma2VqaXF5aHF6bGpvdW1nanhoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzM0MjY3MSwiZXhwIjoyMDk4OTE4NjcxfQ.KZ8_yyKkYQ6fwNl56BXpaRIKQt6uKjLyuYEIjz1Q-h0";

const supabase = createClient(url, serviceRoleKey);

async function inspect() {
  console.log("=== INSPECTING sfkejiqyhqzljoumgjxh ===");
  try {
    const { count: agCount, error: agErr } = await supabase
      .from("agendamentos")
      .select("*", { count: "exact", head: true });
    
    if (agErr) console.error("agendamentos error:", agErr);
    else console.log("Total agendamentos:", agCount);

    const { count: signCount, error: signErr } = await supabase
      .from("agendamentos")
      .select("*", { count: "exact", head: true })
      .not("assinatura_responsavel", "is", null);

    if (signErr) console.error("signed error:", signErr);
    else console.log("Signed agendamentos:", signCount);

    const { count: pacCount, error: pacErr } = await supabase
      .from("pacientes")
      .select("*", { count: "exact", head: true });

    if (pacErr) console.error("pacientes error:", pacErr);
    else console.log("Total pacientes:", pacCount);

    const { count: fatCount, error: fatErr } = await supabase
      .from("faturas")
      .select("*", { count: "exact", head: true });

    if (fatErr) console.error("faturas error:", fatErr);
    else console.log("Total faturas:", fatCount);

    const { data: sampleSigns, error: sampleErr } = await supabase
      .from("agendamentos")
      .select("id, status, data_inicio, assinatura_responsavel, nome_assinante, data_assinatura")
      .not("assinatura_responsavel", "is", null)
      .limit(5);

    if (sampleErr) console.error("sample signs error:", sampleErr);
    else {
      console.log("Sample signed agendamentos:");
      sampleSigns.forEach(s => {
        console.log(`- ID: ${s.id}, Date: ${s.data_inicio}, Signer: ${s.nome_assinante}, Signature starts: ${s.assinatura_responsavel ? s.assinatura_responsavel.slice(0, 40) : null}`);
      });
    }
  } catch (e) {
    console.error("Exception:", e);
  }
}

inspect();
