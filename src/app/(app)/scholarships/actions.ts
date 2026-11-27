"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, parseForm, type ActionState } from "@/lib/actions";
import { requireFamily, requireParent } from "@/lib/auth";
import { OPPORTUNITY_STATUSES, values } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import {
  checkbox,
  enumField,
  optionalDate,
  optionalMoney,
  optionalText,
  optionalUrl,
  requiredText,
} from "@/lib/validation";

const scholarshipSchema = z
  .object({
    name: requiredText("Scholarship name", 200),
    sponsor: optionalText(200),
    description: optionalText(4000),
    award_amount: optionalMoney(),
    renewable: checkbox(),
    eligibility_notes: optionalText(4000),
    application_url: optionalUrl(),
    source_url: optionalUrl(),
    opens_on: optionalDate(),
    deadline: optionalDate(),
  })
  .refine((v) => !v.opens_on || !v.deadline || v.opens_on <= v.deadline, {
    path: ["deadline"],
    message: "Deadline must be on or after the opening date",
  });

function revalidateAll() {
  revalidatePath("/scholarships", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/students", "layout");
  revalidatePath("/awards");
}

export async function createScholarship(_: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(scholarshipSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scholarships")
    .insert({ ...parsed.data, family_id: ctx.family.id })
    .select("id")
    .single();
  if (error) return failure(error);
  if (ctx.studentId) {
    await supabase.from("scholarship_applications").insert({
      family_id: ctx.family.id,
      scholarship_id: data.id,
      student_id: ctx.studentId,
    });
  }
  revalidateAll();
  redirect(`/scholarships/${data.id}`);
}

export async function updateScholarship(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(scholarshipSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase
    .from("scholarships")
    .update(parsed.data)
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  if (error) return failure(error);
  revalidateAll();
  redirect(`/scholarships/${id}`);
}

export async function setScholarshipArchived(formData: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = z.uuid().parse(formData.get("id"));
  const archive = formData.get("archive") === "true";
  const supabase = await createClient();
  await supabase
    .from("scholarships")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  revalidateAll();
}

export async function deleteScholarship(formData: FormData): Promise<void> {
  const ctx = await requireParent();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("scholarships")
    .delete()
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  if (error) throw new Error(error.message);
  revalidateAll();
  redirect("/scholarships");
}

/** Start tracking a scholarship for one student. */
export async function trackScholarship(formData: FormData): Promise<void> {
  const ctx = await requireFamily();
  const scholarshipId = z.uuid().parse(formData.get("scholarship_id"));
  const studentId = z.uuid().parse(formData.get("student_id"));
  const supabase = await createClient();
  await supabase
    .from("scholarship_applications")
    .upsert(
      { family_id: ctx.family.id, scholarship_id: scholarshipId, student_id: studentId },
      { onConflict: "scholarship_id,student_id", ignoreDuplicates: true },
    );
  revalidateAll();
}

const trackingSchema = z.object({
  status: enumField(values(OPPORTUNITY_STATUSES), "Status"),
  submitted_on: optionalDate(),
  decision_date: optionalDate(),
  awarded_amount: optionalMoney(),
  notes: optionalText(2000),
});

export async function updateTracking(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(trackingSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase
    .from("scholarship_applications")
    .update(parsed.data)
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  if (error) return failure(error);
  revalidateAll();
  return { message: "Saved." };
}

export async function untrackScholarship(formData: FormData): Promise<void> {
  const ctx = await requireParent();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase
    .from("scholarship_applications")
    .delete()
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  revalidateAll();
}
