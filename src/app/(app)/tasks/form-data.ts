import "server-only";
import type { FamilyContext } from "@/lib/auth";
import {
  getActiveMembers,
  getApplications,
  getScholarshipApplications,
  getStudentOptions,
} from "@/lib/data";
import type { TaskFormOptions } from "./task-form";

export async function taskFormOptions(ctx: FamilyContext): Promise<TaskFormOptions> {
  const [students, members, applications, tracking] = await Promise.all([
    getStudentOptions(ctx),
    getActiveMembers(ctx.family.id),
    getApplications(ctx.family.id),
    getScholarshipApplications(ctx.family.id),
  ]);
  return {
    students,
    members: members.map((m) => ({
      value: m.user_id,
      label: m.user_id === ctx.user.id ? `${m.display_name} (me)` : m.display_name,
    })),
    applications: applications.map((a) => ({
      value: a.id,
      label: `${a.college?.name} — ${a.student?.display_name}`,
    })),
    scholarshipApplications: tracking.map((t) => ({
      value: t.id,
      label: `${t.scholarship?.name} — ${t.student?.display_name}`,
    })),
  };
}
