const url = "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

async function listTables() {
  const restUrl = `${url}/rest/v1/`;
  try {
    const response = await fetch(restUrl, {
      headers: {
        "apikey": key,
        "Authorization": `Bearer ${key}`
      }
    });
    const spec = await response.json();
    console.log("=== TABLES IN OLD SUPABASE DB ===");
    if (spec.definitions) {
      console.log(Object.keys(spec.definitions));
    } else {
      console.log("No definitions found:", spec);
    }
  } catch (err) {
    console.error(err);
  }
}

listTables();
