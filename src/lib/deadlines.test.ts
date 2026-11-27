import { describe, expect, it } from "vitest";
import { collectDeadlines, planningProgress } from "./deadlines";

const sources = {
  applications: [
    {
      id: "a1",
      status: "in_progress",
      application_deadline: "2026-12-01",
      student_id: "s1",
      college: { name: "State U" },
      student: { display_name: "Alex" },
      requirements: [
        { id: "r1", is_complete: false, due_date: "2026-11-20", title: "Essay" },
        { id: "r2", is_complete: true, due_date: "2026-11-21", title: "Transcript" },
      ],
    },
    {
      id: "a2",
      status: "submitted",
      application_deadline: "2026-11-30",
      student_id: "s2",
      college: { name: "Tech" },
      student: { display_name: "Blake" },
      requirements: [],
    },
  ],
  scholarshipApplications: [
    {
      id: "sa1",
      status: "in_progress",
      scholarship_id: "sch1",
      student_id: "s2",
      scholarship: { name: "Rotary", deadline: "2026-12-10" },
      student: { display_name: "Blake" },
    },
    {
      id: "sa2",
      status: "submitted",
      scholarship_id: "sch1",
      student_id: "s1",
      scholarship: { name: "Rotary", deadline: "2026-12-10" },
      student: { display_name: "Alex" },
    },
  ],
  tasks: [
    { id: "t1", title: "FAFSA reminder", status: "todo", due_date: "2026-12-05", student_id: null },
    { id: "t2", title: "Done task", status: "done", due_date: "2026-12-02", student_id: "s1" },
    { id: "t3", title: "Far away", status: "todo", due_date: "2027-03-01", student_id: "s1" },
  ],
  studentName: (id: string | null) => (id === "s1" ? "Alex" : "Blake"),
};

describe("collectDeadlines", () => {
  it("includes only open, dated work in the window, sorted by date", () => {
    const items = collectDeadlines(sources, { through: "2026-12-31" });
    expect(items.map((i) => i.key)).toEqual(["req-r1", "app-a1", "task-t1", "sch-sa1"]);
    expect(items[0]).toMatchObject({
      title: "Essay (State U)",
      context: "Alex",
      kind: "requirement",
    });
  });

  it("can exclude overdue items with a start date", () => {
    const items = collectDeadlines(sources, { from: "2026-11-27", through: "2026-12-31" });
    expect(items.map((i) => i.key)).toEqual(["app-a1", "task-t1", "sch-sa1"]);
  });

  it("filters to one student plus family-wide items", () => {
    const items = collectDeadlines(sources, { through: "2026-12-31", studentId: "s2" });
    expect(items.map((i) => i.key)).toEqual(["task-t1", "sch-sa1"]);
  });
});

describe("planningProgress", () => {
  it("counts submitted applications and completed requirements, ignoring withdrawn", () => {
    expect(planningProgress(sources.applications)).toEqual({ done: 2, total: 4 });
    expect(
      planningProgress([{ status: "withdrawn", requirements: [{ is_complete: false }] }]),
    ).toEqual({ done: 0, total: 0 });
  });
});
