/**
 * Collects dated, still-open work from every source into one list for the
 * dashboard. Pure so it can be unit tested.
 */

export type DeadlineKind = "application" | "requirement" | "scholarship" | "task";

export interface DeadlineItem {
  key: string;
  kind: DeadlineKind;
  title: string;
  /** Secondary text: student name, college, etc. */
  context: string;
  date: string;
  href: string;
  studentId: string | null;
}

interface Sources {
  applications: Array<{
    id: string;
    status: string;
    application_deadline: string | null;
    student_id: string;
    college: { name: string } | null;
    student: { display_name: string } | null;
    requirements: Array<{
      id: string;
      is_complete: boolean;
      due_date: string | null;
      title?: string;
    }>;
  }>;
  scholarshipApplications: Array<{
    id: string;
    status: string;
    scholarship_id: string;
    student_id: string;
    scholarship: { name: string; deadline: string | null } | null;
    student: { display_name: string } | null;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    due_date: string | null;
    student_id: string | null;
  }>;
  studentName: (id: string | null) => string;
}

const OPEN_APPLICATION = new Set(["not_started", "researching", "in_progress"]);
const OPEN_SCHOLARSHIP = new Set(["saved", "researching", "in_progress"]);
const OPEN_TASK = new Set(["todo", "in_progress"]);

export function collectDeadlines(
  sources: Sources,
  opts: { from?: string; through: string; studentId?: string | null },
): DeadlineItem[] {
  const items: DeadlineItem[] = [];

  for (const a of sources.applications) {
    const college = a.college?.name ?? "College";
    const student = a.student?.display_name ?? "";
    if (OPEN_APPLICATION.has(a.status) && a.application_deadline) {
      items.push({
        key: `app-${a.id}`,
        kind: "application",
        title: `${college} application due`,
        context: student,
        date: a.application_deadline,
        href: `/applications/${a.id}`,
        studentId: a.student_id,
      });
    }
    for (const r of a.requirements) {
      if (!r.is_complete && r.due_date) {
        items.push({
          key: `req-${r.id}`,
          kind: "requirement",
          title: r.title ? `${r.title} (${college})` : `${college} requirement`,
          context: student,
          date: r.due_date,
          href: `/applications/${a.id}`,
          studentId: a.student_id,
        });
      }
    }
  }

  for (const s of sources.scholarshipApplications) {
    if (OPEN_SCHOLARSHIP.has(s.status) && s.scholarship?.deadline) {
      items.push({
        key: `sch-${s.id}`,
        kind: "scholarship",
        title: `${s.scholarship.name} deadline`,
        context: s.student?.display_name ?? "",
        date: s.scholarship.deadline,
        href: `/scholarships/${s.scholarship_id}`,
        studentId: s.student_id,
      });
    }
  }

  for (const t of sources.tasks) {
    if (OPEN_TASK.has(t.status) && t.due_date) {
      items.push({
        key: `task-${t.id}`,
        kind: "task",
        title: t.title,
        context: t.student_id ? sources.studentName(t.student_id) : "Whole family",
        date: t.due_date,
        href: `/tasks/${t.id}`,
        studentId: t.student_id,
      });
    }
  }

  return items
    .filter((i) => (!opts.from || i.date >= opts.from) && i.date <= opts.through)
    .filter((i) => !opts.studentId || i.studentId === opts.studentId || i.studentId === null)
    .sort((a, b) =>
      a.date === b.date ? a.title.localeCompare(b.title) : a.date < b.date ? -1 : 1,
    );
}

/** Share of concrete application steps finished: requirements done + applications submitted. */
export function planningProgress(
  applications: Array<{ status: string; requirements: Array<{ is_complete: boolean }> }>,
): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const a of applications) {
    if (a.status === "withdrawn") continue;
    total += 1 + a.requirements.length;
    if (!OPEN_APPLICATION.has(a.status)) done += 1;
    done += a.requirements.filter((r) => r.is_complete).length;
  }
  return { done, total };
}
