import Link from "next/link";
import { CLOSED_APPLICATION_STATUSES, type ApplicationRow } from "@/lib/data";
import { APPLICATION_STATUSES, APPLICATION_TYPES, labelFor } from "@/lib/options";
import { Due } from "./due";
import { StatusBadge } from "./status-badge";

/** Compact application rows for student and college pages. */
export function ApplicationList({
  applications,
  today,
  show,
}: {
  applications: ApplicationRow[];
  today: string;
  show: "college" | "student";
}) {
  if (applications.length === 0) {
    return <p className="text-sm text-slate-500">No applications yet.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {applications.map((a) => {
        const done = a.requirements.filter((r) => r.is_complete).length;
        return (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0">
              <Link
                href={`/applications/${a.id}`}
                className="text-sm font-medium text-slate-800 hover:text-teal"
              >
                {show === "college" ? a.college?.name : a.student?.display_name}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {labelFor(APPLICATION_TYPES, a.application_type)}
                <Due
                  date={a.application_deadline}
                  today={today}
                  done={CLOSED_APPLICATION_STATUSES.includes(a.status)}
                  compact
                />
                {a.requirements.length > 0 && (
                  <span>
                    {done}/{a.requirements.length} requirements
                  </span>
                )}
              </div>
            </div>
            <StatusBadge options={APPLICATION_STATUSES} value={a.status} />
          </li>
        );
      })}
    </ul>
  );
}
