import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig, SupabaseNotConfiguredError } from "./config";

export async function createClient() {
  // Read cookies first so every caller is rendered dynamically, even unconfigured.
  const cookieStore = await cookies();
  const config = getSupabaseConfig();
  if (!config) throw new SupabaseNotConfiguredError();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; src/proxy.ts refreshes sessions.
        }
      },
    },
  });
}
