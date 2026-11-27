import "server-only";
import { cache } from "react";
import type { FamilyContext } from "./auth";
import { createClient } from "./supabase/server";
import type { College, FamilyMember, Student } from "./types";

/** Students visible to the current member (RLS limits students to their own profile). */
export const getStudents = cache(
  async (familyId: string, includeArchived = false): Promise<Student[]> => {
    const supabase = await createClient();
    let query = supabase
      .from("students")
      .select("*")
      .eq("family_id", familyId)
      .order("graduation_year")
      .order("display_name");
    if (!includeArchived) query = query.is("archived_at", null);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Student[];
  },
);

export async function getStudentOptions(ctx: FamilyContext) {
  const students = await getStudents(ctx.family.id);
  return students.map((s) => ({ value: s.id, label: s.display_name }));
}

export const getColleges = cache(
  async (familyId: string, includeArchived = false): Promise<College[]> => {
    const supabase = await createClient();
    let query = supabase.from("colleges").select("*").eq("family_id", familyId).order("name");
    if (!includeArchived) query = query.is("archived_at", null);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as College[];
  },
);

export const getActiveMembers = cache(async (familyId: string): Promise<FamilyMember[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("family_members")
    .select("*")
    .eq("family_id", familyId)
    .eq("status", "active")
    .order("display_name");
  if (error) throw error;
  return (data ?? []) as FamilyMember[];
});

/** Student id to show by default in student-scoped forms (a student's own profile). */
export function defaultStudentId(ctx: FamilyContext, students: { value: string }[]) {
  return ctx.studentId ?? (students.length === 1 ? students[0].value : undefined);
}
