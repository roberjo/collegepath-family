import { Check } from "lucide-react";
import Link from "next/link";
import { setTaskStatus } from "@/app/(app)/tasks/actions";
import { TASK_PRIORITIES, labelFor, toneFor } from "@/lib/options";
import type { Task } from "@/lib/types";
import { Due } from "./due";
import { Badge, cn } from "./ui";

export function TaskList({
  tasks,
  today,
  names,
  emptyText = "Nothing here.",
}: {
  tasks: Task[];
  today: string;
  /** Lookup for student ids and member user ids. */
  names: { students: Map<string, string>; members: Map<string, string> };
  emptyText?: string;
}) {
  if (tasks.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {tasks.map((t) => {
        const done = t.status === "done" || t.status === "cancelled";
        return (
          <li key={t.id} className="flex items-start gap-3 py-3">
            <form action={setTaskStatus}>
              <input type="hidden" name="id" value={t.id} />
              <input type="hidden" name="status" value={t.status === "done" ? "todo" : "done"} />
              <button
                type="submit"
                aria-label={t.status === "done" ? `Reopen “${t.title}”` : `Mark “${t.title}” done`}
                className={cn(
                  "mt-0.5 flex h-6 w-6 items-center justify-center rounded-md",
                  t.status === "done"
                    ? "bg-teal text-white"
                    : "border-2 border-slate-300 text-transparent hover:border-teal hover:text-teal",
                )}
              >
                <Check size={14} aria-hidden />
              </button>
            </form>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/tasks/${t.id}`}
                  className={cn(
                    "text-sm hover:text-teal",
                    done ? "text-slate-400 line-through" : "font-medium text-slate-800",
                  )}
                >
                  {t.title}
                </Link>
                {(t.priority === "high" || t.priority === "urgent") && !done && (
                  <Badge tone={toneFor(TASK_PRIORITIES, t.priority)}>
                    {labelFor(TASK_PRIORITIES, t.priority)}
                  </Badge>
                )}
                {t.status === "in_progress" && <Badge tone="blue">In progress</Badge>}
                {t.status === "cancelled" && <Badge>Cancelled</Badge>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                <Due date={t.due_date} today={today} done={done} />
                <span>
                  {t.student_id ? (names.students.get(t.student_id) ?? "Student") : "Whole family"}
                </span>
                {t.assigned_to && <span>→ {names.members.get(t.assigned_to) ?? "Member"}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
