import { CalendarDays, Plus } from "lucide-react";
import type { Metadata } from "next";
import { FilterBar, FilterSelect } from "@/components/filter-bar";
import { TaskList } from "@/components/task-list";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { getActiveMembers, getStudents, getTasks, PRIORITY_RANK } from "@/lib/data";
import { addDays, todayInZone } from "@/lib/dates";
import type { Task } from "@/lib/types";

export const metadata: Metadata = { title: "Tasks & deadlines · CollegePath Family" };

const SHOW_OPTIONS = [
  { value: "done", label: "Completed" },
  { value: "all", label: "Everything" },
];

function byDueThenPriority(a: Task, b: Task) {
  if (a.due_date !== b.due_date) {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date < b.due_date ? -1 : 1;
  }
  return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string; student?: string; who?: string }>;
}) {
  const params = await searchParams;
  const show = params.show ?? "open";
  const ctx = await requireFamily();
  const today = todayInZone(ctx.family.time_zone);
  const [tasks, students, members] = await Promise.all([
    getTasks(ctx.family.id),
    getStudents(ctx.family.id, true),
    getActiveMembers(ctx.family.id),
  ]);
  const names = {
    students: new Map(students.map((s) => [s.id, s.display_name])),
    members: new Map(members.map((m) => [m.user_id, m.display_name])),
  };

  const isOpen = (t: Task) => t.status === "todo" || t.status === "in_progress";
  const filtered = tasks
    .filter((t) => {
      if (show === "open" && !isOpen(t)) return false;
      if (show === "done" && isOpen(t)) return false;
      if (params.student === "family" && t.student_id) return false;
      if (params.student && params.student !== "family" && t.student_id !== params.student)
        return false;
      if (params.who === "me" && t.assigned_to !== ctx.user.id) return false;
      if (params.who === "unassigned" && t.assigned_to) return false;
      return true;
    })
    .sort(byDueThenPriority);

  const weekEnd = addDays(today, 7);
  const groups =
    show === "open"
      ? [
          { title: "Overdue", tasks: filtered.filter((t) => t.due_date && t.due_date < today) },
          {
            title: "Due in the next 7 days",
            tasks: filtered.filter(
              (t) => t.due_date && t.due_date >= today && t.due_date <= weekEnd,
            ),
          },
          { title: "Later", tasks: filtered.filter((t) => t.due_date && t.due_date > weekEnd) },
          { title: "No due date", tasks: filtered.filter((t) => !t.due_date) },
        ].filter((g) => g.tasks.length > 0)
      : [{ title: show === "done" ? "Completed" : "All tasks", tasks: filtered }];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks & deadlines"
        description="Shared to-dos with owners and due dates."
        actions={
          <LinkButton href="/tasks/new">
            <Plus size={16} aria-hidden /> New task
          </LinkButton>
        }
      />

      <FilterBar resetHref="/tasks">
        <FilterSelect
          name="show"
          label="Show"
          value={show}
          options={SHOW_OPTIONS}
          allLabel="Open tasks"
        />
        <FilterSelect
          name="student"
          label="For"
          value={params.student}
          options={[
            { value: "family", label: "Whole family" },
            ...students
              .filter((s) => !s.archived_at)
              .map((s) => ({ value: s.id, label: s.display_name })),
          ]}
          allLabel="Everyone"
        />
        <FilterSelect
          name="who"
          label="Assigned"
          value={params.who}
          options={[
            { value: "me", label: "Assigned to me" },
            { value: "unassigned", label: "Unassigned" },
          ]}
          allLabel="Anyone"
        />
      </FilterBar>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No tasks yet"
          description="Add to-dos like requesting a recommendation, scheduling a visit, or finishing an essay draft."
          action={
            <LinkButton href="/tasks/new">
              <Plus size={16} aria-hidden /> New task
            </LinkButton>
          }
        />
      ) : groups.length === 0 ? (
        <EmptyState title="Nothing to show" description="No tasks match these filters." />
      ) : (
        groups.map((g) => (
          <Card key={g.title} title={`${g.title} (${g.tasks.length})`}>
            <TaskList tasks={g.tasks} today={today} names={names} />
          </Card>
        ))
      )}
    </div>
  );
}
