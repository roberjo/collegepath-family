"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, parseForm, type ActionState } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { optionalText } from "@/lib/validation";

const schema = z.object({ display_name: optionalText(80) });

export async function acceptInvitation(
  token: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_invitation", {
    p_token: token,
    p_display_name: parsed.data.display_name ?? "",
  });
  if (error) return failure(error);
  redirect("/dashboard?joined=1");
}
