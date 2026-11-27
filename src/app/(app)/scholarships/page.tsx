import { Award, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Due } from "@/components/due";
import { FilterBar, FilterSearch, FilterSelect } from "@/components/filter-bar";
import { StatusBadge } from "@/components/status-badge";
import { Badge, EmptyState, LinkButton, ListItemLink, money, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { getScholarshipApplications, getStudentOptions } from "@/lib/data";
import { addDays, todayInZone } from "@/lib/dates";
import { OPPORTUNITY_STATUSES } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { Scholarship } from "@/lib/types";

export const metadata: Metadata = { title: "Scholarships · CollegePath Family" };

const PIPELINE = [
  { label: "Saved / researching", statuses: ["saved", "researching"] },
  { label: "In progress", statuses: ["in_progress"] },
  { label: "Submitted", statuses: ["submitted"] },
  { label: "Awarded", statuses: ["awarded"] },
];

const WHEN_OPTIONS = [
  { value: "open", label: "Deadline not passed" },
  { value: "30", label: "Deadline in next 30 days" },
  { value: "past", label: "Deadline passed" },
];

export default async function ScholarshipsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    student?: string;
    status?: string;
    when?: string;
    archived?: string;
  }>;
}) {
  const params = await searchParams;
  const ctx = await requireFamily();
  const today = todayInZone(ctx.family.time_zone);
  const showArchived = params.archived === "1";
  const supabase = await createClient();
  let query = supabase
    .from("scholarships")
    .select("*")
    .eq("family_id", ctx.family.id)
    .order("deadline", { ascending: true, nullsFirst: false });
  if (!showArchived) query = query.is("archived_at", null);
  const [{ data }, tracking, students] = await Promise.all([
    query,
    getScholarshipApplications(ctx.family.id),
    getStudentOptions(ctx),
  ]);
  const scholarships = (data ?? []) as Scholarship[];

  const q = params.q?.trim().toLowerCase();
  const filtered = scholarships.filter((s) => {
    const rows = tracking.filter((t) => t.scholarship_id === s.id);
    if (q && !`${s.name} ${s.sponsor ?? ""}`.toLowerCase().includes(q)) return false;
    if (params.student && !rows.some((t) => t.student_id === params.student)) return false;
    if (
      params.status &&
      !rows.some(
        (t) => t.status === params.status && (!params.student || t.student_id === params.student),
      )
    )
      return false;
    if (params.when === "open" && s.deadline && s.deadline < today) return false;
    if (params.when === "past" && !(s.deadline && s.deadline < today)) return false;
    if (
      params.when === "30" &&
      !(s.deadline && s.deadline >= today && s.deadline <= addDays(today, 30))
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scholarships"
        description="One shared list of opportunities, tracked separately for each student."
        actions={
          <LinkButton href="/scholarships/new">
            <Plus size={16} aria-hidden /> Add scholarship
          </LinkButton>
        }
      />

      <section aria-label="Scholarship pipeline" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {PIPELINE.map((stage) => (
          <div key={stage.label} className="rounded-2xl border border-line bg-white p-4">
            <div className="text-2xl font-semibold text-slate-800">
              {tracking.filter((t) => stage.statuses.includes(t.status)).length}
            </div>
            <div className="mt-1 text-xs text-slate-500">{stage.label}</div>
          </div>
        ))}
      </section>

      {scholarships.length > 0 && (
        <FilterBar resetHref="/scholarships">
          <FilterSearch value={params.q} placeholder="Name or sponsor" />
          {students.length > 1 && (
            <FilterSelect
              name="student"
              label="Student"
              value={params.student}
              options={students}
              allLabel="All students"
            />
          )}
          <FilterSelect
            name="status"
            label="Status"
            value={params.status}
            options={OPPORTUNITY_STATUSES}
            allLabel="Any status"
          />
          <FilterSelect
            name="when"
            label="Deadline"
            value={params.when}
            options={WHEN_OPTIONS}
            allLabel="Any time"
          />
        </FilterBar>
      )}

      {scholarships.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No scholarships yet"
          description="Add opportunities as you find them — from school counselors, community groups, employers, or colleges."
          action={
            <LinkButton href="/scholarships/new">
              <Plus size={16} aria-hidden /> Add scholarship
            </LinkButton>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No scholarships match these filters" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((s) => {
            const rows = tracking.filter((t) => t.scholarship_id === s.id);
            return (
              <ListItemLink key={s.id} href={`/scholarships/${s.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-800">{s.name}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {[
                        s.sponsor,
                        s.award_amount != null && money(s.award_amount),
                        s.renewable && "Renewable",
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No details yet"}
                    </p>
                  </div>
                  {s.archived_at && <Badge tone="amber">Archived</Badge>}
                </div>
                <div className="mt-3">
                  <Due date={s.deadline} today={today} />
                </div>
                {rows.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {rows.map((t) => (
                      <li key={t.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                        {t.student?.display_name}:
                        <StatusBadge options={OPPORTUNITY_STATUSES} value={t.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </ListItemLink>
            );
          })}
        </div>
      )}

      <Link
        href={showArchived ? "/scholarships" : "/scholarships?archived=1"}
        className="inline-block text-xs font-medium text-teal hover:underline"
      >
        {showArchived ? "Hide archived scholarships" : "Show archived scholarships"}
      </Link>
    </div>
  );
}
