import { connection, NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Public health check for deploy verification and uptime monitoring.
 * Reports the deployed commit and whether Supabase Auth is reachable.
 * Never returns user or family data.
 */
export async function GET() {
  await connection();
  const config = getSupabaseConfig();
  let supabase = "unconfigured";
  if (config) {
    try {
      const res = await fetch(`${config.url}/auth/v1/health`, {
        headers: { apikey: config.key },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      supabase = res.ok ? "ok" : `error ${res.status}`;
    } catch {
      supabase = "unreachable";
    }
  }
  const ok = supabase === "ok";
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      version: process.env.NEXT_PUBLIC_APP_VERSION ?? "development",
      supabase,
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
