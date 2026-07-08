import { createClient } from '@supabase/supabase-js';

const oldUrl = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const oldKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

const newUrl = "https://peafjcreckbtjuzfcrld.supabase.co";
const newKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYWZqY3JlY2tidGp1emZjcmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTgxMzMsImV4cCI6MjA5NzI3NDEzM30.U8eXNP3kaPgD0OGOTwmr8ZIVZApb-G8eMXDXksIch_E";

const oldSupabase = createClient(oldUrl, oldKey);
const newSupabase = createClient(newUrl, newKey);

async function migrate() {
  console.log("1. Migrating faturas...");
  const { data: oldFaturas, error: oldFatErr } = await oldSupabase
    .from('faturas')
    .select('*');

  if (oldFatErr) {
    console.error("Failed to fetch old faturas:", oldFatErr);
    return;
  }
  console.log(`Fetched ${oldFaturas.length} faturas from old DB.`);

  if (oldFaturas.length > 0) {
    const { data: newFatData, error: newFatErr } = await newSupabase
      .from('faturas')
      .upsert(oldFaturas, { onConflict: 'id' });

    if (newFatErr) {
      console.error("Failed to upsert faturas to new DB:", newFatErr);
      return;
    }
    console.log("Successfully migrated faturas!");
  }

  console.log("2. Migrating fatura_itens...");
  const { data: oldItems, error: oldItemErr } = await oldSupabase
    .from('fatura_itens')
    .select('*');

  if (oldItemErr) {
    console.error("Failed to fetch old fatura_itens:", oldItemErr);
    return;
  }
  console.log(`Fetched ${oldItems.length} fatura_itens from old DB.`);

  if (oldItems.length > 0) {
    const { data: newItemData, error: newItemErr } = await newSupabase
      .from('fatura_itens')
      .upsert(oldItems, { onConflict: 'id' });

    if (newItemErr) {
      console.error("Failed to upsert fatura_itens to new DB:", newItemErr);
      return;
    }
    console.log("Successfully migrated fatura_itens!");
  }

  console.log("Migration complete!");
}

migrate();
