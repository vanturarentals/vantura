import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./config";

export function createClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  return createBrowserClient(env.url, env.anonKey);
}

/** Auth client with optional non-persistent session (Remember me unchecked). */
export function createAuthClient(remember = true) {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  if (remember) return createBrowserClient(env.url, env.anonKey);

  return createBrowserClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      storage: {
        getItem: (key) => sessionStorage.getItem(key),
        setItem: (key, value) => sessionStorage.setItem(key, value),
        removeItem: (key) => sessionStorage.removeItem(key),
      },
    },
  });
}
