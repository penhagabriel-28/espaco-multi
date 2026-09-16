import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID || "xjlmsgwqjjpuqpbrlvwr";

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://xjlmsgwqjjpuqpbrlvwr.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqbG1zZ3dxampwdXFwYnJsdndyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNzg4MTQsImV4cCI6MjA5NTY1NDgxNH0.0kwln23c78z-fYx-plG3yI1wCTAyASLP6ov6PT6WcqM";

// Clean up stale or foreign Supabase tokens from localStorage
function cleanupStaleStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Stale tokens from old project peafjcreckbtjuzfcrld
      if (k.includes("peafjcreckbtjuzfcrld")) {
        keysToRemove.push(k);
        continue;
      }
      if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
        // If it belongs to a project other than our current SUPABASE_PROJECT_ID
        if (!k.includes(SUPABASE_PROJECT_ID)) {
          keysToRemove.push(k);
          continue;
        }
        // Inspect token payload
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            const token = parsed?.access_token || parsed?.currentSession?.access_token;
            if (token && typeof token === "string") {
              const parts = token.split(".");
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                if (payload?.ref && payload.ref !== SUPABASE_PROJECT_ID) {
                  keysToRemove.push(k);
                }
              }
            }
          }
        } catch {
          // If unparseable, keep safe
        }
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn("[Supabase] Storage cleanup notice:", e);
  }
}

// Resilient fetch wrapper to auto-recover if a stale JWT causes 401 / PGRST301
const resilientFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const response = await fetch(input, init);
  if (response.status === 401) {
    try {
      const clone = response.clone();
      const body = await clone.json();
      if (
        body &&
        (body.code === "PGRST301" ||
          body.message?.includes("JWT") ||
          body.message?.includes("key") ||
          body.message?.includes("token"))
      ) {
        console.warn("[Supabase] Invalid or stale JWT detected, purging session and retrying with anon key...");
        if (typeof window !== "undefined" && window.localStorage) {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i);
            if (k && (k.startsWith("sb-") || k.includes("supabase.auth.token"))) {
              localStorage.removeItem(k);
            }
          }
        }
        const headers = new Headers(init?.headers);
        headers.set("apikey", SUPABASE_PUBLISHABLE_KEY);
        headers.set("Authorization", `Bearer ${SUPABASE_PUBLISHABLE_KEY}`);
        return fetch(input, { ...init, headers });
      }
    } catch {
      // ignore json parse error
    }
  }
  return response;
};

function createSupabaseClient() {
  cleanupStaleStorage();

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: resilientFetch,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
