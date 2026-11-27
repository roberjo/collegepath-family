import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  dueLabel,
  dueState,
  formatDate,
  greeting,
  isIsoDate,
  todayInZone,
} from "./dates";

describe("dates", () => {
  it("validates ISO calendar dates", () => {
    expect(isIsoDate("2026-12-04")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("12/04/2026")).toBe(false);
  });

  it("computes today in the family's time zone, not UTC", () => {
    // 03:00 UTC on Nov 28 is still Nov 27 in New York.
    const now = new Date("2026-11-28T03:00:00Z");
    expect(todayInZone("America/New_York", now)).toBe("2026-11-27");
    expect(todayInZone("UTC", now)).toBe("2026-11-28");
  });

  it("falls back to UTC for an invalid zone", () => {
    expect(todayInZone("Not/AZone", new Date("2026-11-28T03:00:00Z"))).toBe("2026-11-28");
  });

  it("counts whole days across DST changes", () => {
    expect(daysBetween("2026-03-07", "2026-03-09")).toBe(2);
    expect(daysBetween("2026-11-27", "2026-11-20")).toBe(-7);
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
  });

  it("formats a date-only value without shifting it", () => {
    expect(formatDate("2026-12-04")).toBe("Dec 4, 2026");
    expect(formatDate(null)).toBe("—");
  });

  it("describes due dates in words", () => {
    const today = "2026-11-27";
    expect(dueLabel("2026-11-24", today)).toBe("3 days overdue");
    expect(dueLabel("2026-11-26", today)).toBe("1 day overdue");
    expect(dueLabel("2026-11-27", today)).toBe("Due today");
    expect(dueLabel("2026-11-28", today)).toBe("Due tomorrow");
    expect(dueLabel("2026-12-04", today)).toBe("In 7 days");
    expect(dueLabel(null, today)).toBe("No due date");
    expect(dueState("2026-11-24", today)).toBe("overdue");
    expect(dueState("2026-12-04", today)).toBe("soon");
    expect(dueState("2026-12-05", today)).toBe("upcoming");
  });

  it("greets by local hour", () => {
    expect(greeting("America/New_York", new Date("2026-11-27T14:00:00Z"))).toBe("Good morning");
    expect(greeting("America/New_York", new Date("2026-11-27T20:00:00Z"))).toBe("Good afternoon");
    expect(greeting("America/New_York", new Date("2026-11-28T01:00:00Z"))).toBe("Good evening");
  });
});
