import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const oldSupabase = createClient(oldUrl, oldKey);

// Helper to escape SQL string values
function val(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  // Escape single quotes for SQL string
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function run() {
  console.log("Fetching faturas...");
  const { data: faturas, error: fatErr } = await oldSupabase.from('faturas').select('*');
  if (fatErr) {
    console.error("Fat error:", fatErr);
    return;
  }

  console.log("Fetching fatura_itens...");
  const { data: items, error: itemErr } = await oldSupabase.from('fatura_itens').select('*');
  if (itemErr) {
    console.error("Item error:", itemErr);
    return;
  }

  let sql = `-- Billing Migration Script --\n`;
  sql += `BEGIN;\n\n`;
  sql += `-- Disable USER triggers temporarily to avoid double triggers/logic (keeps system triggers enabled)\n`;
  sql += `ALTER TABLE public.faturas DISABLE TRIGGER USER;\n`;
  sql += `ALTER TABLE public.fatura_itens DISABLE TRIGGER USER;\n\n`;

  sql += `-- 1. Insert faturas --\n`;
  for (const f of faturas) {
    sql += `INSERT INTO public.faturas (id, competencia, created_at, especialidade, metodo, observacoes, paciente_id, pago_em, profissional_id, status, updated_at, valor, vencimento) VALUES (\n`;
    sql += `  ${val(f.id)}, ${val(f.competencia)}, ${val(f.created_at)}, ${val(f.especialidade)}, ${val(f.metodo)}, ${val(f.observacoes)}, ${val(f.paciente_id)}, ${val(f.pago_em)}, ${val(f.profissional_id)}, ${val(f.status)}, ${val(f.updated_at)}, ${val(f.valor)}, ${val(f.vencimento)}\n`;
    sql += `) ON CONFLICT (id) DO UPDATE SET\n`;
    sql += `  competencia = EXCLUDED.competencia,\n`;
    sql += `  especialidade = EXCLUDED.especialidade,\n`;
    sql += `  metodo = EXCLUDED.metodo,\n`;
    sql += `  observacoes = EXCLUDED.observacoes,\n`;
    sql += `  paciente_id = EXCLUDED.paciente_id,\n`;
    sql += `  pago_em = EXCLUDED.pago_em,\n`;
    sql += `  profissional_id = EXCLUDED.profissional_id,\n`;
    sql += `  status = EXCLUDED.status,\n`;
    sql += `  valor = EXCLUDED.valor,\n`;
    sql += `  vencimento = EXCLUDED.vencimento;\n\n`;
  }

  sql += `-- 2. Insert fatura_itens --\n`;
  for (const item of items) {
    sql += `INSERT INTO public.fatura_itens (id, fatura_id, agendamento_id, valor_unitario, quantidade, total, descricao, created_at) VALUES (\n`;
    sql += `  ${val(item.id)}, ${val(item.fatura_id)}, ${val(item.agendamento_id)}, ${val(item.valor_unitario)}, ${val(item.quantidade)}, ${val(item.total)}, ${val(item.descricao)}, ${val(item.created_at)}\n`;
    sql += `) ON CONFLICT (id) DO UPDATE SET\n`;
    sql += `  fatura_id = EXCLUDED.fatura_id,\n`;
    sql += `  agendamento_id = EXCLUDED.agendamento_id,\n`;
    sql += `  valor_unitario = EXCLUDED.valor_unitario,\n`;
    sql += `  quantidade = EXCLUDED.quantidade,\n`;
    sql += `  total = EXCLUDED.total,\n`;
    sql += `  descricao = EXCLUDED.descricao;\n\n`;
  }

  sql += `-- Re-enable USER triggers\n`;
  sql += `ALTER TABLE public.faturas ENABLE TRIGGER USER;\n`;
  sql += `ALTER TABLE public.fatura_itens ENABLE TRIGGER USER;\n\n`;
  sql += `COMMIT;\n`;

  fs.writeFileSync('scratch/billing_migration.sql', sql);
  console.log(`Successfully generated SQL migration script with ${faturas.length} faturas and ${items.length} items!`);
}

run();
