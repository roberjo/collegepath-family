"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, parseForm, type ActionState } from "@/lib/actions";
import { requireFamily } from "@/lib/auth";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, values } from "@/lib/options";
import { safeNextPath } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import {
  enumField,
  optionalDate,
  optionalText,
  optionalUuid,
  requiredText,
} from "@/lib/validation";

const taskSchema = z.object({
  title: requiredText("Task", 200),
  description: optionalText(4000),
  category: enumField(values(TASK_CATEGORIES), "Category"),
  student_id: optionalUuid(),
  assigned_to: optionalUuid(),
  due_date: optionalDate(),
  priority: enumField(values(TASK_PRIORITIES), "Priority"),
  status: enumField(values(TASK_STATUSES), "Status"),
  related_application_id: optionalUuid(),
  related_scholarship_application_id: optionalUuid(),
  return_to: z.string().optional(),
});

function revalidateAll() {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/students", "layout");
}

export async function createTask(_: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(taskSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { return_to, ...task } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    ...task,
    family_id: ctx.family.id,
    created_by: ctx.user.id,
  });
  if (error) return failure(error);
  revalidateAll();
  redirect(safeNextPath(return_to, "/tasks"));
}

export async function updateTask(
  id: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireFamily();
  const parsed = parseForm(taskSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { return_to, ...task } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(task)
    .eq("id", id)
    .eq("family_id", ctx.family.id)
    .select("id");
  if (error) return failure(error);
  if (!data?.length) return { error: "You don't have permission to edit this task." };
  revalidateAll();
  redirect(safeNextPath(return_to, "/tasks"));
}

export async function setTaskStatus(formData: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = z.uuid().parse(formData.get("id"));
  const status = enumField(values(TASK_STATUSES), "Status").parse(formData.get("status"));
  const supabase = await createClient();
  await supabase.from("tasks").update({ status }).eq("id", id).eq("family_id", ctx.family.id);
  revalidateAll();
}

export async function deleteTask(formData: FormData): Promise<void> {
  const ctx = await requireFamily();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id).eq("family_id", ctx.family.id);
  revalidateAll();
  redirect("/tasks");
}
