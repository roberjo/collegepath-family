/**
 * Date helpers for date-only values (deadlines, due dates).
 *
 * Postgres `date` columns arrive as "YYYY-MM-DD" strings. Treating them as
 * JavaScript Dates in local time shifts them across time zones, so every
 * helper here works on the calendar date itself and only uses a time zone to
 * decide what "today" is for the family (see docs/adr/0006-dates-and-time-zones.md).
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Today's calendar date in the given IANA time zone, as YYYY-MM-DD. */
export function todayInZone(timeZone: string, now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return now.toISOString().slice(0, 10);
  }
}

function toUtcMs(isoDate: string): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / 86_400_000);
}

export function addDays(isoDate: string, days: number): string {
  return new Date(toUtcMs(isoDate) + days * 86_400_000).toISOString().slice(0, 10);
}

/** "Dec 4, 2026" — formatted without shifting the calendar date. */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(toUtcMs(isoDate.slice(0, 10))));
}

/** Long form for page headings: "Friday, November 27, 2026". */
export function formatLongDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(toUtcMs(isoDate)));
}

export type DueState = "overdue" | "today" | "soon" | "upcoming" | "none";

export function dueState(dueDate: string | null | undefined, today: string): DueState {
  if (!dueDate) return "none";
  const days = daysBetween(today, dueDate);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 7) return "soon";
  return "upcoming";
}

/** Human label that never relies on colour alone: "3 days overdue", "Due today", "In 5 days". */
export function dueLabel(dueDate: string | null | undefined, today: string): string {
  if (!dueDate) return "No due date";
  const days = daysBetween(today, dueDate);
  if (days < -1) return `${-days} days overdue`;
  if (days === -1) return "1 day overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `In ${days} days`;
}

/** Time-of-day greeting for the family's zone. */
export function greeting(timeZone: string, now: Date = new Date()): string {
  let hour: number;
  try {
    hour = Number(
      new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hourCycle: "h23" }).format(now),
    );
  } catch {
    hour = now.getUTCHours();
  }
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
