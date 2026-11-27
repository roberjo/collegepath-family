import { ClipboardList, Plus } from "lucide-react";
import type { Metadata } from "next";
import { Due } from "@/components/due";
import { FilterBar, FilterSelect } from "@/components/filter-bar";
import { Progress } from "@/components/progress";
import { StatusBadge } from "@/components/status-badge";
import { EmptyState, LinkButton, ListItemLink, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { CLOSED_APPLICATION_STATUSES, getApplications, getStudentOptions } from "@/lib/data";
import { addDays, todayInZone } from "@/lib/dates";
import { APPLICATION_STATUSES, APPLICATION_TYPES, labelFor } from "@/lib/options";

export const metadata: Metadata = { title: "Applications · CollegePath Family" };

const WHEN_OPTIONS = [
  { value: "open", label: "Still in progress" },
  { value: "overdue", label: "Past deadline, not submitted" },
  { value: "30", label: "Deadline in next 30 days" },
];

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; status?: string; when?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireFamily();
  const today = todayInZone(ctx.family.time_zone);
  const [applications, students] = await Promise.all([
    getApplications(ctx.family.id),
    getStudentOptions(ctx),
  ]);

  const filtered = applications.filter((a) => {
    const open = !CLOSED_APPLICATION_STATUSES.includes(a.status);
    if (params.student && a.student_id !== params.student) return false;
    if (params.status && a.status !== params.status) return false;
    if (params.when === "open" && !open) return false;
    if (
      params.when === "overdue" &&
      !(open && a.application_deadline && a.application_deadline < today)
    )
      return false;
    if (
      params.when === "30" &&
      !(
        a.application_deadline &&
        a.application_deadline >= today &&
        a.application_deadline <= addDays(today, 30)
      )
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Each student's applications, deadlines, and requirement checklists."
        actions={
          <LinkButton href="/applications/new">
            <Plus size={16} aria-hidden /> New application
          </LinkButton>
        }
      />

      {applications.length > 0 && (
        <FilterBar resetHref="/applications">
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
            options={APPLICATION_STATUSES}
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

      {applications.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications yet"
          description="Start an application when a student decides to apply to a college on their list."
          action={
            <LinkButton href="/applications/new">
              <Plus size={16} aria-hidden /> New application
            </LinkButton>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No applications match these filters" />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((a) => {
            const done = a.requirements.filter((r) => r.is_complete).length;
            const open = !CLOSED_APPLICATION_STATUSES.includes(a.status);
            return (
              <ListItemLink key={a.id} href={`/applications/${a.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-800">{a.college?.name}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {a.student?.display_name} · {labelFor(APPLICATION_TYPES, a.application_type)}
                    </p>
                  </div>
                  <StatusBadge options={APPLICATION_STATUSES} value={a.status} />
                </div>
                <div className="mt-3">
                  <Due date={a.application_deadline} today={today} done={!open} />
                </div>
                {a.requirements.length > 0 && (
                  <div className="mt-3">
                    <Progress
                      done={done}
                      total={a.requirements.length}
                      label="Requirements complete"
                    />
                  </div>
                )}
              </ListItemLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
