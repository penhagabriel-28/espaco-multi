import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://peafjcreckbtjuzfcrld.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYWZqY3JlY2tidGp1emZjcmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTgxMzMsImV4cCI6MjA5NzI3NDEzM30.U8eXNP3kaPgD0OGOTwmr8ZIVZApb-G8eMXDXksIch_E";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking faturas table schema...");
  const { data, error } = await supabase
    .from('faturas')
    .select('*')
    .limit(1);

  if (error) {
    console.error("Database query failed:", error);
  } else {
    console.log("Faturas query succeeded! Columns available:", Object.keys(data[0] || {}));
  }
}

check();
