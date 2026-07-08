import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env", "utf-8");
const url = env.match(/SUPABASE_URL="([^"]+)"/)[1];
const key = env.match(/SUPABASE_PUBLISHABLE_KEY="([^"]+)"/)[1];

const supabase = createClient(url, key);

async function check() {
  try {
    console.log("Fetching list of all tables in the public schema...");
    
    // We can run an RPC or fetch a common table to see if it works.
    // If we don't have an RPC, we can query information_schema via an API if exposed,
    // or we can test common table names.
    // Wait, let's look at the OpenAPI definition of the public schema!
    // Supabase PostgREST exposes the OpenAPI definition at the root URL.
    // Let's fetch the OpenAPI definition to list all exposed tables!
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        apikey: key,
      }
    });
    const openapi = await response.json();
    console.log("OpenAPI keys:", Object.keys(openapi));
    if (openapi.paths) {
      const tables = Object.keys(openapi.paths)
        .map(p => p.substring(1))
        .filter(p => p && !p.includes("/"));
      console.log("Exposed tables:", tables);
    } else {
      console.log("OpenAPI response:", openapi);
    }
  } catch (err) {
    console.error(err);
  }
}

check();
