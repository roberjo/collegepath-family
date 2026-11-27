"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, parseForm, type ActionState } from "@/lib/actions";
import { requireParent } from "@/lib/auth";
import { AWARD_TYPES, values } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import {
  checkbox,
  enumField,
  optionalText,
  optionalUuid,
  requiredMoney,
  requiredText,
  requiredUuid,
} from "@/lib/validation";

const awardSchema = z.object({
  student_id: requiredUuid("Student"),
  award_name: requiredText("Award name", 200),
  award_type: enumField(values(AWARD_TYPES), "Award type"),
  amount: requiredMoney("Amount"),
  is_renewable: checkbox(),
  academic_year: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}$/, "Use the format 2028-29")
      .refine(
        (v) => (Number(v.slice(0, 4)) + 1) % 100 === Number(v.slice(5)),
        "Years must be consecutive, like 2028-29",
      )
      .nullable(),
  ),
  college_id: optionalUuid(),
  scholarship_application_id: optionalUuid(),
  notes: optionalText(2000),
});

function revalidateAll() {
  revalidatePath("/awards", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/students", "layout");
  revalidatePath("/scholarships", "layout");
}

export async function createAward(_: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireParent();
  const parsed = parseForm(awardSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase
    .from("awards")
    .insert({ ...parsed.data, family_id: ctx.family.id });
  if (error) return failure(error);
  revalidateAll();
  redirect("/awards?saved=1");
}

export async function updateAward(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireParent();
  const parsed = parseForm(awardSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase
    .from("awards")
    .update(parsed.data)
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  if (error) return failure(error);
  revalidateAll();
  redirect("/awards?saved=1");
}

export async function deleteAward(formData: FormData): Promise<void> {
  const ctx = await requireParent();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("awards").delete().eq("id", id).eq("family_id", ctx.family.id);
  revalidateAll();
  redirect("/awards");
}
