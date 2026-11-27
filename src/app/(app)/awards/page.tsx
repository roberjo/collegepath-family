import { Plus, Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, EmptyState, LinkButton, money, Notice, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { getScholarshipApplications, getStudents } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { AWARD_TYPES, labelFor } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { Award } from "@/lib/types";

export const metadata: Metadata = { title: "Awards · CollegePath Family" };

type AwardRow = Award & { college: { name: string } | null };

export default async function AwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const ctx = await requireFamily();
  const supabase = await createClient();
  const [{ data }, students, tracking] = await Promise.all([
    supabase
      .from("awards")
      .select("*, college:colleges(name)")
      .eq("family_id", ctx.family.id)
      .order("created_at", { ascending: false }),
    getStudents(ctx.family.id, true),
    getScholarshipApplications(ctx.family.id),
  ]);
  const awards = (data ?? []) as AwardRow[];
  const recorded = new Set(awards.map((a) => a.scholarship_application_id).filter(Boolean));
  const pending = tracking.filter(
    (t) => t.status === "submitted" || (t.status === "awarded" && !recorded.has(t.id)),
  );
  const studentsWithAwards = students.filter(
    (s) => awards.some((a) => a.student_id === s.id) || !s.archived_at,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Awards"
        description="Confirmed scholarships and college aid — kept separate from pending opportunities."
        actions={
          ctx.isParent && (
            <LinkButton href="/awards/new">
              <Plus size={16} aria-hidden /> Record award
            </LinkButton>
          )
        }
      />
      {saved && <Notice>Award saved.</Notice>}

      <section aria-label="Confirmed totals" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {studentsWithAwards.map((s) => {
          const mine = awards.filter((a) => a.student_id === s.id);
          const total = mine.reduce((sum, a) => sum + Number(a.amount), 0);
          const renewable = mine
            .filter((a) => a.is_renewable)
            .reduce((sum, a) => sum + Number(a.amount), 0);
          return (
            <div key={s.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="text-xs font-medium text-slate-500">{s.display_name}</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-800">
                {money(total)}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Confirmed · {mine.length} award{mine.length === 1 ? "" : "s"}
                {renewable > 0 && ` · ${money(renewable)} renewable`}
              </div>
            </div>
          );
        })}
      </section>

      <Card title="Confirmed awards">
        {awards.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No awards recorded yet"
            description={
              ctx.isParent
                ? "Record awards as decision letters arrive."
                : "Awards appear here once a parent records them."
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {awards.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">{a.award_name}</span>
                    <Badge>{labelFor(AWARD_TYPES, a.award_type)}</Badge>
                    {a.is_renewable && <Badge tone="teal">Renewable</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {[
                      students.find((s) => s.id === a.student_id)?.display_name,
                      a.college?.name,
                      a.academic_year,
                      `recorded ${formatDate(a.created_at.slice(0, 10))}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-800">
                    {money(Number(a.amount))}
                  </span>
                  {ctx.isParent && (
                    <Link
                      href={`/awards/${a.id}`}
                      className="text-xs font-medium text-teal hover:underline"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Awaiting a decision"
        description="Submitted or reportedly awarded scholarships without a confirmed award. Not included in totals."
      >
        {pending.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing pending.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {pending.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/scholarships/${t.scholarship_id}`}
                    className="text-sm font-medium text-slate-800 hover:text-teal"
                  >
                    {t.scholarship?.name}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {t.student?.display_name} ·{" "}
                    {t.status === "awarded"
                      ? "Reported awarded — record it once confirmed"
                      : "Submitted"}
                  </div>
                </div>
                <span className="text-xs text-slate-500">
                  {t.awarded_amount != null
                    ? money(Number(t.awarded_amount))
                    : t.scholarship?.award_amount != null
                      ? `up to ${money(Number(t.scholarship.award_amount))}`
                      : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
