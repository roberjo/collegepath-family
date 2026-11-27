import { GraduationCap, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FilterBar, FilterSearch, FilterSelect } from "@/components/filter-bar";
import { StatusBadge } from "@/components/status-badge";
import { Badge, EmptyState, LinkButton, ListItemLink, money, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { getColleges, getStudents } from "@/lib/data";
import { INTEREST_LEVELS } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { CollegeInterest, InterestLevel } from "@/lib/types";

export const metadata: Metadata = { title: "Colleges · CollegePath Family" };

export default async function CollegesPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; level?: string; q?: string; archived?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireFamily();
  const showArchived = params.archived === "1";
  const supabase = await createClient();
  const [colleges, students, { data: interestData }] = await Promise.all([
    getColleges(ctx.family.id, showArchived),
    getStudents(ctx.family.id),
    supabase.from("college_interests").select("*").eq("family_id", ctx.family.id),
  ]);
  const interests = (interestData ?? []) as CollegeInterest[];
  const studentName = new Map(students.map((s) => [s.id, s.display_name]));

  const q = params.q?.trim().toLowerCase();
  const filtered = colleges.filter((c) => {
    if (q && !`${c.name} ${c.location ?? ""}`.toLowerCase().includes(q)) return false;
    const mine = interests.filter((i) => i.college_id === c.id);
    if (params.student && !mine.some((i) => i.student_id === params.student)) return false;
    if (
      params.level &&
      !mine.some(
        (i) =>
          i.interest_level === (params.level as InterestLevel) &&
          (!params.student || i.student_id === params.student),
      )
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colleges"
        description="The family's college directory and each student's interest list."
        actions={
          <LinkButton href="/colleges/new">
            <Plus size={16} aria-hidden /> Add college
          </LinkButton>
        }
      />

      {colleges.length > 0 && (
        <FilterBar resetHref="/colleges">
          <FilterSearch value={params.q} placeholder="Name or location" />
          {students.length > 1 && (
            <FilterSelect
              name="student"
              label="Student"
              value={params.student}
              options={students.map((s) => ({ value: s.id, label: s.display_name }))}
              allLabel="All students"
            />
          )}
          <FilterSelect
            name="level"
            label="Interest level"
            value={params.level}
            options={INTEREST_LEVELS}
            allLabel="Any"
          />
          {showArchived && <input type="hidden" name="archived" value="1" />}
        </FilterBar>
      )}

      {colleges.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No colleges yet"
          description="Add colleges the family is researching. Each one can be on one or both students' lists."
          action={
            <LinkButton href="/colleges/new">
              <Plus size={16} aria-hidden /> Add college
            </LinkButton>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No colleges match these filters" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((c) => {
            const mine = interests.filter((i) => i.college_id === c.id);
            return (
              <ListItemLink key={c.id} href={`/colleges/${c.id}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-800">{c.name}</h2>
                  {c.archived_at && <Badge tone="amber">Archived</Badge>}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {[
                    c.location,
                    c.estimated_annual_cost != null && `${money(c.estimated_annual_cost)}/yr est.`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "No details yet"}
                </p>
                {mine.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {mine.map((i) => (
                      <li key={i.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                        {studentName.get(i.student_id)}:
                        <StatusBadge options={INTEREST_LEVELS} value={i.interest_level} />
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
        href={showArchived ? "/colleges" : "/colleges?archived=1"}
        className="inline-block text-xs font-medium text-teal hover:underline"
      >
        {showArchived ? "Hide archived colleges" : "Show archived colleges"}
      </Link>
    </div>
  );
}
