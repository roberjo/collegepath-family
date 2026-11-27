import "server-only";
import type { FamilyContext } from "@/lib/auth";
import { getColleges, getScholarshipApplications, getStudentOptions } from "@/lib/data";

export async function awardFormOptions(ctx: FamilyContext) {
  const [students, colleges, tracking] = await Promise.all([
    getStudentOptions(ctx),
    getColleges(ctx.family.id),
    getScholarshipApplications(ctx.family.id),
  ]);
  return {
    students,
    colleges: colleges.map((c) => ({ value: c.id, label: c.name })),
    scholarshipApplications: tracking.map((t) => ({
      value: t.id,
      label: `${t.scholarship?.name} — ${t.student?.display_name}`,
    })),
  };
}
