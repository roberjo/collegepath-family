import {
  Award,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  CircleDollarSign,
  ClipboardList,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Due } from "@/components/due";
import { FilterBar, FilterSelect } from "@/components/filter-bar";
import { Progress } from "@/components/progress";
import { Badge, Card, cn, LinkButton, money, Notice, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import {
  CLOSED_APPLICATION_STATUSES,
  getApplications,
  getScholarshipApplications,
  getStudents,
  getTasks,
  OPEN_OPPORTUNITY_STATUSES,
} from "@/lib/data";
import { addDays, formatLongDate, greeting, todayInZone } from "@/lib/dates";
import { collectDeadlines, planningProgress, type DeadlineKind } from "@/lib/deadlines";
import { createClient } from "@/lib/supabase/server";
import type { CollegeInterest } from "@/lib/types";

export const metadata: Metadata = { title: "Overview · CollegePath Family" };

const KIND_LABEL: Record<DeadlineKind, string> = {
  application: "Application",
  requirement: "Requirement",
  scholarship: "Scholarship",
  task: "Task",
};

function Metric({
  icon: Icon,
  label,
  value,
  note,
  href,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  note: string;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-line bg-white p-5 shadow-[0_2px_10px_rgba(18,38,63,.03)] transition hover:border-slate-300"
    >
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", accent)}>
        <Icon size={18} aria-hidden />
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-700">{label}</div>
      <div className="mt-1 text-[11px] text-slate-500">{note}</div>
    </Link>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const ctx = await requireFamily();
  const tz = ctx.family.time_zone;
  const today = todayInZone(tz);
  const supabase = await createClient();

  const [students, applications, tracking, tasks, interestsRes, awardsRes, membersRes, invitesRes] =
    await Promise.all([
      getStudents(ctx.family.id),
      getApplications(ctx.family.id),
      getScholarshipApplications(ctx.family.id),
      getTasks(ctx.family.id),
      supabase
        .from("college_interests")
        .select("student_id, college_id")
        .eq("family_id", ctx.family.id),
      supabase.from("awards").select("student_id, amount").eq("family_id", ctx.family.id),
      supabase
        .from("family_members")
        .select("id", { count: "exact", head: true })
        .eq("family_id", ctx.family.id)
        .eq("status", "active"),
      ctx.isParent
        ? supabase
            .from("family_invitations")
            .select("id", { count: "exact", head: true })
            .eq("family_id", ctx.family.id)
        : Promise.resolve({ count: 0 }),
    ]);

  // Students see their own view; parents can focus on one student.
  const focus =
    ctx.studentId ?? (students.some((s) => s.id === params.student) ? params.student! : null);
  const inFocus = <T extends { student_id: string | null }>(rows: T[]) =>
    focus ? rows.filter((r) => r.student_id === focus || r.student_id === null) : rows;

  const interests = inFocus(
    (interestsRes.data ?? []) as Pick<CollegeInterest, "student_id" | "college_id">[],
  );
  const apps = inFocus(applications);
  const scholarshipRows = inFocus(tracking);
  const awards = inFocus((awardsRes.data ?? []) as { student_id: string; amount: number }[]);
  const studentName = (id: string | null) =>
    students.find((s) => s.id === id)?.display_name ?? "Student";

  const deadlines = collectDeadlines(
    { applications, scholarshipApplications: tracking, tasks, studentName },
    { through: addDays(today, 30), studentId: focus },
  );
  const overdue = deadlines.filter((d) => d.date < today);
  const upcoming = deadlines.filter((d) => d.date >= today);
  const shownDeadlines = [...overdue, ...upcoming].slice(0, 10);

  const confirmedTotal = awards.reduce((sum, a) => sum + Number(a.amount), 0);
  const pendingCount = scholarshipRows.filter((t) => t.status === "submitted").length;
  const pipeline = [
    {
      label: "Saved",
      count: scholarshipRows.filter((t) => OPEN_OPPORTUNITY_STATUSES.includes(t.status)).length,
    },
    { label: "Submitted", count: pendingCount },
    { label: "Awarded", count: scholarshipRows.filter((t) => t.status === "awarded").length },
  ];

  const visibleStudents = focus ? students.filter((s) => s.id === focus) : students;
  const setupSteps = [
    { done: students.length > 0, label: "Add a profile for each student", href: "/students/new" },
    {
      done: (membersRes.count ?? 0) > 1 || (invitesRes.count ?? 0) > 0,
      label: "Invite the other parent and the students",
      href: "/settings",
    },
    { done: interests.length > 0, label: "Start each student's college list", href: "/colleges" },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow={formatLongDate(today)}
        title={`${greeting(tz)}, ${ctx.member.display_name.split(" ")[0]}`}
        description={
          focus
            ? `Focused on ${studentName(focus)}${ctx.studentId ? "" : " and family-wide items"}.`
            : "Here's what's happening across your family's college plans."
        }
        actions={
          <LinkButton href="/tasks/new?return_to=/dashboard">
            <CalendarDays size={16} aria-hidden /> Add a task
          </LinkButton>
        }
      />
      {params.welcome && <Notice>Your family workspace is ready.</Notice>}
      {params.joined && <Notice>Welcome to {ctx.family.name}!</Notice>}
      {params.password && <Notice>Your password has been updated.</Notice>}
      {params.denied && (
        <Notice tone="amber">That page is only available to parent administrators.</Notice>
      )}
      {ctx.member.role === "student" && !ctx.studentId && (
        <Notice tone="amber">
          Your account isn&apos;t linked to a student profile yet. Ask a parent to link it in Family
          settings.
        </Notice>
      )}

      {ctx.isParent && students.length > 1 && (
        <FilterBar resetHref="/dashboard">
          <FilterSelect
            name="student"
            label="View"
            value={focus ?? undefined}
            options={students.map((s) => ({ value: s.id, label: s.display_name }))}
            allLabel="Whole family"
          />
        </FilterBar>
      )}

      {ctx.isParent && setupSteps.some((s) => !s.done) && (
        <Card title="Getting started" description="A few steps to set up your workspace.">
          <ol className="space-y-3">
            {setupSteps.map((step) => (
              <li key={step.label} className="flex items-center gap-3 text-sm">
                {step.done ? (
                  <CheckCircle2 size={18} className="text-teal" aria-label="Done" />
                ) : (
                  <Circle size={18} className="text-slate-300" aria-label="Not done" />
                )}
                {step.done ? (
                  <span className="text-slate-500 line-through">{step.label}</span>
                ) : (
                  <Link href={step.href} className="text-teal hover:underline">
                    {step.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </Card>
      )}

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={GraduationCap}
          label="Colleges on lists"
          value={new Set(interests.map((i) => i.college_id)).size}
          note="Across student shortlists"
          href={focus ? `/colleges?student=${focus}` : "/colleges"}
          accent="bg-blue-50 text-blue-700"
        />
        <Metric
          icon={ClipboardList}
          label="Applications in progress"
          value={apps.filter((a) => !CLOSED_APPLICATION_STATUSES.includes(a.status)).length}
          note={`${apps.filter((a) => a.status === "submitted").length} submitted, awaiting decision`}
          href={focus ? `/applications?student=${focus}&when=open` : "/applications?when=open"}
          accent="bg-teal-50 text-teal-700"
        />
        <Metric
          icon={Award}
          label="Scholarships in play"
          value={pipeline[0].count + pipeline[1].count}
          note="Saved, in progress, or submitted"
          href={focus ? `/scholarships?student=${focus}` : "/scholarships"}
          accent="bg-violet-50 text-violet-700"
        />
        <Metric
          icon={CalendarDays}
          label="Due in the next 30 days"
          value={upcoming.length}
          note={overdue.length ? `${overdue.length} overdue` : "Nothing overdue"}
          href="/tasks"
          accent={overdue.length ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card
          title="Upcoming deadlines"
          description="Overdue and next 30 days: applications, requirements, scholarships, and tasks."
        >
          {shownDeadlines.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing due in the next 30 days.</p>
          ) : (
            <ul className="space-y-3">
              {shownDeadlines.map((d) => (
                <li key={d.key}>
                  <Link
                    href={d.href}
                    className="-m-2 flex items-start gap-3 rounded-xl p-2 hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">{d.title}</span>
                        <Badge>{KIND_LABEL[d.kind]}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <Due date={d.date} today={today} />
                        {d.context && <span>{d.context}</span>}
                      </div>
                    </div>
                    <ChevronRight size={16} className="mt-1 text-slate-400" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {deadlines.length > shownDeadlines.length && (
            <p className="mt-4 text-xs text-slate-500">
              +{deadlines.length - shownDeadlines.length} more in the next 30 days.
            </p>
          )}
        </Card>

        <Card
          title="Student workspaces"
          description="Application steps completed: submitted applications plus finished requirements."
        >
          {visibleStudents.length === 0 ? (
            <p className="text-sm text-slate-500">No student profiles yet.</p>
          ) : (
            <ul className="space-y-3">
              {visibleStudents.map((s) => {
                const mine = applications.filter((a) => a.student_id === s.id);
                const progress = planningProgress(mine);
                const listCount = (interestsRes.data ?? []).filter(
                  (i) => i.student_id === s.id,
                ).length;
                return (
                  <li key={s.id}>
                    <Link
                      href={`/students/${s.id}`}
                      className="block rounded-xl border border-slate-100 p-4 transition hover:border-slate-300"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">
                          {s.display_name}
                        </span>
                        <Badge>Class of {s.graduation_year}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {listCount} college{listCount === 1 ? "" : "s"} on list · {mine.length}{" "}
                        application{mine.length === 1 ? "" : "s"}
                      </p>
                      {progress.total > 0 && (
                        <div className="mt-3">
                          <Progress
                            done={progress.done}
                            total={progress.total}
                            label="Application steps"
                          />
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card
          title={
            <span className="flex items-center gap-2">
              <Award size={18} className="text-teal" aria-hidden /> Scholarship pipeline
            </span>
          }
          description="Opportunities from discovery through decisions."
        >
          <div className="grid grid-cols-3 gap-2">
            {pipeline.map((stage) => (
              <div key={stage.label} className="rounded-xl bg-slate-50 p-3">
                <div className="text-xl font-semibold text-slate-800">{stage.count}</div>
                <div className="mt-1 text-[11px] text-slate-500">{stage.label}</div>
              </div>
            ))}
          </div>
          <LinkButton href="/scholarships" variant="ghost" size="sm" className="mt-4">
            Open scholarships
          </LinkButton>
        </Card>
        <Card
          title={
            <span className="flex items-center gap-2">
              <CircleDollarSign size={18} className="text-teal" aria-hidden /> Award summary
            </span>
          }
          description="Confirmed awards only — pending opportunities are not counted."
        >
          <div className="text-2xl font-semibold tracking-tight text-slate-800">
            {money(confirmedTotal)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {awards.length} confirmed award{awards.length === 1 ? "" : "s"}
            {pendingCount > 0 &&
              ` · ${pendingCount} scholarship application${pendingCount === 1 ? "" : "s"} awaiting a decision`}
          </div>
          <LinkButton href="/awards" variant="ghost" size="sm" className="mt-4">
            Open awards
          </LinkButton>
        </Card>
      </section>
    </div>
  );
}
