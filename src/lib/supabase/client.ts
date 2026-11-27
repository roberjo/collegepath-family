import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig, SupabaseNotConfiguredError } from "./config";

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new SupabaseNotConfiguredError();
  return createBrowserClient(config.url, config.key);
}
