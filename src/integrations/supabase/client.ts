import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

// Configuração do Supabase conectado ao projeto oficial restaurado
export const SUPABASE_PROJECT_ID = "peafjcreckbtjuzfcrld";

export const SUPABASE_URL = "https://peafjcreckbtjuzfcrld.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlYWZqY3JlY2tidGp1emZjcmxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTgxMzMsImV4cCI6MjA5NzI3NDEzM30.U8eXNP3kaPgD0OGOTwmr8ZIVZApb-G8eMXDXksIch_E";

// Clean up stale or foreign Supabase tokens from localStorage
function cleanupStaleStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Tokens de autenticação que não pertençam ao projeto ativo
      if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
        if (!k.includes(SUPABASE_PROJECT_ID)) {
          keysToRemove.push(k);
          continue;
        }
      }
      if (k.includes("xjlmsgwqjjpuqpbrlvwr")) {
        keysToRemove.push(k);
        continue;
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (e) {
    console.warn("[Supabase] Storage cleanup notice:", e);
  }
}

// Resilient fetch wrapper to auto-recover if a stale JWT causes 401 / PGRST301
const resilientFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
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
          
          const targetUrl =
            typeof input === "string"
              ? input
              : input instanceof URL
              ? input.toString()
              : (input as Request).url;

          return fetch(targetUrl, {
            ...init,
            headers,
          });
        }
      } catch {
        // ignore json parse error
      }
    }
    return response;
  } catch (err) {
    console.error("[Supabase Fetch Error]:", err);
    throw err;
  }
};

function createSupabaseClient() {
  cleanupStaleStorage();

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: brokeredPreviewStorage(),
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
