import { Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge, EmptyState, LinkButton, ListItemLink, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { getStudents } from "@/lib/data";

export const metadata: Metadata = { title: "Students · CollegePath Family" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const ctx = await requireFamily();
  const showArchived = (await searchParams).archived === "1";
  const students = await getStudents(ctx.family.id, showArchived);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="A separate plan and progress view for each student."
        actions={
          ctx.isParent && (
            <LinkButton href="/students/new">
              <Plus size={16} aria-hidden /> Add student
            </LinkButton>
          )
        }
      />

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={ctx.isParent ? "No student profiles yet" : "Your profile isn't linked yet"}
          description={
            ctx.isParent
              ? "Add a profile for each student to start tracking colleges and applications."
              : "Ask a parent to link your account to your student profile in Family settings."
          }
          action={
            ctx.isParent && (
              <LinkButton href="/students/new">
                <Plus size={16} aria-hidden /> Add student
              </LinkButton>
            )
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {students.map((s) => (
            <ListItemLink key={s.id} href={`/students/${s.id}`}>
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-semibold text-teal-700"
                  aria-hidden
                >
                  {s.display_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-slate-800">{s.display_name}</h2>
                    <Badge>Class of {s.graduation_year}</Badge>
                    {s.archived_at && <Badge tone="amber">Archived</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {[s.school_name, s.intended_major].filter(Boolean).join(" · ") ||
                      "No school or major yet"}
                  </p>
                </div>
              </div>
            </ListItemLink>
          ))}
        </div>
      )}

      {ctx.isParent && (
        <Link
          href={showArchived ? "/students" : "/students?archived=1"}
          className="inline-block text-xs font-medium text-teal hover:underline"
        >
          {showArchived ? "Hide archived students" : "Show archived students"}
        </Link>
      )}
    </div>
  );
}
