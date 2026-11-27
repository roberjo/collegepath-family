"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, parseForm, type ActionState } from "@/lib/actions";
import { requireFamily, requireParent } from "@/lib/auth";
import { INTEREST_LEVELS, values } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import {
  enumField,
  optionalMoney,
  optionalText,
  optionalUrl,
  requiredText,
  requiredUuid,
} from "@/lib/validation";

const collegeSchema = z.object({
  name: requiredText("College name", 160),
  location: optionalText(160),
  website_url: optionalUrl(),
  admissions_url: optionalUrl(),
  estimated_annual_cost: optionalMoney(),
  notes: optionalText(4000),
});

export async function createCollege(_: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(collegeSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("colleges")
    .insert({ ...parsed.data, family_id: ctx.family.id })
    .select("id")
    .single();
  if (error) return failure(error);
  // A student adding a college is almost always adding it to their own list.
  if (ctx.studentId) {
    await supabase.from("college_interests").insert({
      family_id: ctx.family.id,
      student_id: ctx.studentId,
      college_id: data.id,
    });
  }
  revalidatePath("/colleges");
  redirect(`/colleges/${data.id}`);
}

export async function updateCollege(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(collegeSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase
    .from("colleges")
    .update(parsed.data)
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  if (error) return failure(error);
  revalidatePath("/colleges");
  redirect(`/colleges/${id}`);
}

export async function setCollegeArchived(formData: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = z.uuid().parse(formData.get("id"));
  const archive = formData.get("archive") === "true";
  const supabase = await createClient();
  await supabase
    .from("colleges")
    .update({ archived_at: archive ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  revalidatePath("/colleges");
  revalidatePath(`/colleges/${id}`);
}

export async function deleteCollege(formData: FormData): Promise<void> {
  const ctx = await requireParent();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("colleges")
    .delete()
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  if (error) throw new Error(error.message);
  revalidatePath("/colleges");
  redirect("/colleges");
}

const interestSchema = z.object({
  student_id: requiredUuid("Student"),
  interest_level: enumField(values(INTEREST_LEVELS), "Interest level"),
  notes: optionalText(2000),
});

export async function saveInterest(
  collegeId: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(interestSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase
    .from("college_interests")
    .upsert(
      { ...parsed.data, family_id: ctx.family.id, college_id: collegeId },
      { onConflict: "student_id,college_id" },
    );
  if (error) return failure(error);
  revalidatePath(`/colleges/${collegeId}`);
  revalidatePath("/colleges");
  return { message: "Saved." };
}

export async function removeInterest(formData: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = z.uuid().parse(formData.get("id"));
  const collegeId = z.uuid().parse(formData.get("college_id"));
  const supabase = await createClient();
  await supabase.from("college_interests").delete().eq("id", id).eq("family_id", ctx.family.id);
  revalidatePath(`/colleges/${collegeId}`);
  revalidatePath("/colleges");
}
