"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { failure, parseForm, type ActionState } from "@/lib/actions";
import { requireParent } from "@/lib/auth";
import { ROLE_OPTIONS, values } from "@/lib/options";
import { getOrigin } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import {
  email,
  enumField,
  optionalText,
  optionalUuid,
  requiredText,
  timeZone,
} from "@/lib/validation";

const familySchema = z.object({
  name: requiredText("Family name", 100),
  time_zone: timeZone(),
});

export async function updateFamily(_: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireParent();
  const parsed = parseForm(familySchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase.from("families").update(parsed.data).eq("id", ctx.family.id);
  if (error) return failure(error);
  revalidatePath("/", "layout");
  return { message: "Family details saved." };
}

const inviteSchema = z.object({
  email: email(),
  role: enumField(values(ROLE_OPTIONS), "Role"),
  student_id: optionalUuid(),
  display_name: optionalText(80),
});

export async function createInvitation(_: ActionState, formData: FormData): Promise<ActionState> {
  const ctx = await requireParent();
  const parsed = parseForm(inviteSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { email: address, role, student_id, display_name } = parsed.data;
  const supabase = await createClient();
  const { data: token, error } = await supabase.rpc("create_invitation", {
    p_family_id: ctx.family.id,
    p_email: address,
    p_role: role,
    p_student_id: role === "student" ? student_id : null,
    p_display_name: display_name,
  });
  if (error) return failure(error, { email: address, role, display_name: display_name ?? "" });
  revalidatePath("/settings");
  return {
    message: `Invitation created for ${address}. Send them this link — it is shown only once and expires in 14 days.`,
    result: `${await getOrigin()}/invite/${token as string}`,
  };
}

export async function revokeInvitation(formData: FormData): Promise<void> {
  const ctx = await requireParent();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase
    .from("family_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  revalidatePath("/settings");
}

const memberSchema = z.object({
  role: enumField(values(ROLE_OPTIONS), "Role"),
  student_id: optionalUuid(),
});

export async function updateMember(
  memberId: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await requireParent();
  const parsed = parseForm(memberSchema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase
    .from("family_members")
    .update({
      role: parsed.data.role,
      student_id: parsed.data.role === "student" ? parsed.data.student_id : null,
    })
    .eq("id", memberId)
    .eq("family_id", ctx.family.id);
  if (error) return failure(error);
  revalidatePath("/settings");
  return { message: "Member updated." };
}

export async function setMemberStatus(formData: FormData): Promise<void> {
  const ctx = await requireParent();
  const id = z.uuid().parse(formData.get("id"));
  const status = z.enum(["active", "removed"]).parse(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("family_members")
    .update({ status })
    .eq("id", id)
    .eq("family_id", ctx.family.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}
