"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, parseForm, type ActionState } from "@/lib/actions";
import { requireFamily, requireParent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { optionalText, requiredText } from "@/lib/validation";

const currentYear = new Date().getFullYear();

const studentSchema = z.object({
  display_name: requiredText("Name", 80),
  graduation_year: z.coerce
    .number({ error: "Graduation year is required" })
    .int("Enter a year like 2028")
    .min(2026, "Graduation year must be 2026 or later")
    .max(Math.max(2045, currentYear + 15), "Graduation year is too far in the future"),
  school_name: optionalText(120),
  gpa: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.coerce
      .number({ error: "Enter a GPA like 3.75" })
      .min(0)
      .max(5, "GPA must be 5.0 or lower")
      .nullable(),
  ),
  intended_major: optionalText(120),
  notes: optionalText(4000),
});

export async function createStudent(_: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireParent();
  const parsed = parseForm(studentSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert({ ...parsed.data, family_id: ctx.family.id })
    .select("id")
    .single();
  if (error) return failure(error);
  revalidatePath("/", "layout");
  redirect(`/students/${data.id}`);
}

export async function updateStudent(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(studentSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update(parsed.data)
    .eq("id", id)
    .eq("family_id", ctx.family.id)
    .select("id");
  if (error) return failure(error);
  if (!data?.length) return { error: "You don't have permission to edit this profile." };
  revalidatePath("/", "layout");
  redirect(`/students/${id}`);
}

export async function setStudentArchived(formData: FormData): Promise<void> {
  const ctx = await requireParent();
  const id = z.uuid().parse(formData.get("id"));
  const archive = formData.get("archive") === "true";
  const supabase = await createClient();
  await supabase
    .from("students")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  revalidatePath("/", "layout");
}

export async function deleteStudent(formData: FormData): Promise<void> {
  const ctx = await requireParent();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
  redirect("/students");
}
