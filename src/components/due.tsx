import { AlertTriangle, CalendarDays } from "lucide-react";
import { dueLabel, dueState, formatDate } from "@/lib/dates";
import { cn } from "./ui";

/** Due date plus a text label ("3 days overdue") so urgency never relies on colour alone. */
export function Due({
  date,
  today,
  done = false,
  compact = false,
}: {
  date: string | null;
  today: string;
  done?: boolean;
  compact?: boolean;
}) {
  if (!date) return <span className="text-xs text-slate-400">No date</span>;
  const state = done ? "none" : dueState(date, today);
  const Icon = state === "overdue" ? AlertTriangle : CalendarDays;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        state === "overdue" && "font-semibold text-rose-700",
        (state === "today" || state === "soon") && "font-semibold text-amber-800",
        (state === "upcoming" || state === "none") && "text-slate-500",
      )}
    >
      <Icon size={13} aria-hidden />
      {formatDate(date)}
      {!done && !compact && <span>· {dueLabel(date, today)}</span>}
    </span>
  );
}
