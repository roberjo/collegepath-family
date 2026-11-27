import "server-only";
import { connection } from "next/server";
import { isSupabaseConfigured } from "./config";

/**
 * Server-side check that also opts the route into dynamic rendering, so a
 * build without environment variables never bakes the setup screen into a
 * static page.
 */
export async function supabaseReady(): Promise<boolean> {
  await connection();
  return isSupabaseConfigured();
}
