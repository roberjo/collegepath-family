"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, parseForm, type ActionState } from "@/lib/actions";
import { requireFamily, requireParent } from "@/lib/auth";
import { APPLICATION_STATUSES, APPLICATION_TYPES, REQUIREMENT_TYPES, values } from "@/lib/options";
import { todayInZone } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import {
  enumField,
  formToObject,
  optionalDate,
  optionalText,
  optionalUrl,
  requiredText,
  requiredUuid,
} from "@/lib/validation";

const applicationSchema = z.object({
  student_id: requiredUuid("Student"),
  college_id: requiredUuid("College"),
  application_type: enumField(values(APPLICATION_TYPES), "Application type"),
  status: enumField(values(APPLICATION_STATUSES), "Status"),
  application_deadline: optionalDate(),
  submitted_on: optionalDate(),
  decision_date: optionalDate(),
  portal_url: optionalUrl(),
  notes: optionalText(4000),
});

const DUPLICATE =
  "This student already has an application of that type for this college. Open it from the Applications list instead.";

function revalidateAll() {
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  revalidatePath("/students", "layout");
  revalidatePath("/colleges", "layout");
}

export async function createApplication(_: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(applicationSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .insert({ ...parsed.data, family_id: ctx.family.id })
    .select("id")
    .single();
  if (error) {
    return error.code === "23505"
      ? { error: DUPLICATE, values: formToObject(formData) }
      : failure(error);
  }
  revalidateAll();
  redirect(`/applications/${data.id}`);
}

export async function updateApplication(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(applicationSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update(parsed.data)
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  if (error) return error.code === "23505" ? { error: DUPLICATE } : failure(error);
  revalidateAll();
  redirect(`/applications/${id}`);
}

/** Quick status change from the detail page; stamps submission date when first submitted. */
export async function setApplicationStatus(formData: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = z.uuid().parse(formData.get("id"));
  const status = enumField(values(APPLICATION_STATUSES), "Status").parse(formData.get("status"));
  const supabase = await createClient();
  const patch: Record<string, string> = { status };
  if (status === "submitted") {
    const { data } = await supabase
      .from("applications")
      .select("submitted_on")
      .eq("id", id)
      .single();
    if (!data?.submitted_on) patch.submitted_on = todayInZone(ctx.family.time_zone);
  }
  await supabase.from("applications").update(patch).eq("id", id).eq("family_id", ctx.family.id);
  revalidateAll();
}

export async function deleteApplication(formData: FormData): Promise<void> {
  const ctx = await requireParent();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  if (error) throw new Error(error.message);
  revalidateAll();
  redirect("/applications");
}

const requirementSchema = z.object({
  title: requiredText("Requirement", 200),
  requirement_type: enumField(values(REQUIREMENT_TYPES), "Type"),
  due_date: optionalDate(),
  notes: optionalText(2000),
});

export async function addRequirement(
  applicationId: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(requirementSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase
    .from("application_requirements")
    .insert({ ...parsed.data, family_id: ctx.family.id, application_id: applicationId });
  if (error) return failure(error);
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return { message: `Added “${parsed.data.title}”.` };
}

export async function toggleRequirement(formData: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = z.uuid().parse(formData.get("id"));
  const applicationId = z.uuid().parse(formData.get("application_id"));
  const complete = formData.get("complete") === "true";
  const supabase = await createClient();
  await supabase
    .from("application_requirements")
    .update({ is_complete: complete })
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
  revalidatePath("/dashboard");
}

export async function deleteRequirement(formData: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = z.uuid().parse(formData.get("id"));
  const applicationId = z.uuid().parse(formData.get("application_id"));
  const supabase = await createClient();
  await supabase
    .from("application_requirements")
    .delete()
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath("/applications");
}
