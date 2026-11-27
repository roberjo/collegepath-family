"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { failure, parseForm, type ActionState } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requiredText, timeZone } from "@/lib/validation";

const schema = z.object({
  family_name: requiredText("Family name", 100),
  display_name: requiredText("Your name", 80),
  time_zone: timeZone(),
});

export async function createFamily(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = parseForm(schema, formData);
  if (!parsed.ok) return parsed.state;
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_family", {
    p_name: parsed.data.family_name,
    p_display_name: parsed.data.display_name,
    p_time_zone: parsed.data.time_zone,
  });
  if (error) return failure(error);
  redirect("/dashboard?welcome=1");
}
