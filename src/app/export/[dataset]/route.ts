import { NextResponse, type NextRequest } from "next/server";
import { getFamilyContext } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

/**
 * Parent-only data export (PRD §8 backup/export). Reads with the user's own
 * session, so RLS applies. `all.json` bundles every table; `<table>.csv`
 * exports one table for spreadsheets.
 */
const TABLES = [
  "families",
  "family_members",
  "students",
  "colleges",
  "college_interests",
  "applications",
  "application_requirements",
  "scholarships",
  "scholarship_applications",
  "tasks",
  "awards",
] as const;

type Table = (typeof TABLES)[number];

export async function GET(_: NextRequest, { params }: { params: Promise<{ dataset: string }> }) {
  const { dataset } = await params;
  const ctx = await getFamilyContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!ctx.isParent) return NextResponse.json({ error: "Parents only" }, { status: 403 });

  const supabase = await createClient();
  const load = async (table: Table) => {
    const column = table === "families" ? "id" : "family_id";
    const { data, error } = await supabase.from(table).select("*").eq(column, ctx.family.id);
    if (error) throw error;
    return (data ?? []) as Record<string, unknown>[];
  };
  const stamp = new Date().toISOString().slice(0, 10);
  const headers = { "Cache-Control": "no-store" };

  if (dataset === "all.json") {
    const entries = await Promise.all(TABLES.map(async (t) => [t, await load(t)] as const));
    const body = JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        family_id: ctx.family.id,
        tables: Object.fromEntries(entries),
      },
      null,
      2,
    );
    return new NextResponse(body, {
      headers: {
        ...headers,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="collegepath-export-${stamp}.json"`,
      },
    });
  }

  const table = dataset.replace(/\.csv$/, "") as Table;
  if (!dataset.endsWith(".csv") || !TABLES.includes(table)) {
    return NextResponse.json({ error: "Unknown export" }, { status: 404 });
  }
  return new NextResponse(toCsv(await load(table)), {
    headers: {
      ...headers,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="collegepath-${table}-${stamp}.csv"`,
    },
  });
}
