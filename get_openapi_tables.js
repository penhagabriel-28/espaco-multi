import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

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
    console.log("=== SCHEMAS & TABLES IN SUPABASE REST API ===");
    if (spec.definitions) {
      console.log("Definitions/Tables:", Object.keys(spec.definitions));
    } else {
      console.log("No definitions found in OpenAPI spec:", spec);
    }
  } catch (err) {
    console.error(err);
  }
}

listTables();
