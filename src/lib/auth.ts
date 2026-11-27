import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Family, FamilyMember } from "@/lib/types";

export interface SessionUser {
  id: string;
  email: string | null;
}

export interface FamilyContext {
  user: SessionUser;
  family: Family;
  member: FamilyMember;
  isParent: boolean;
  /** The student profile linked to a student account (null for parents). */
  studentId: string | null;
}

/** Verified user from the session JWT, or null. Cached per request. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null };
});

/**
 * The signed-in user's active family membership. A user may belong to more
 * than one family in the data model; the MVP uses the earliest active one.
 */
export const getFamilyContext = cache(async (): Promise<FamilyContext | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("family_members")
    .select("*, family:families(id, name, time_zone, created_at)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.family) return null;
  const { family, ...member } = data as FamilyMember & { family: Family };
  return {
    user,
    family,
    member,
    isParent: member.role === "parent",
    studentId: member.role === "student" ? member.student_id : null,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireFamily(): Promise<FamilyContext> {
  const user = await getUser();
  if (!user) redirect("/login");
  const ctx = await getFamilyContext();
  if (!ctx) redirect("/onboarding");
  return ctx;
}

/** For parent-only pages and actions. RLS enforces this too. */
export async function requireParent(): Promise<FamilyContext> {
  const ctx = await requireFamily();
  if (!ctx.isParent) redirect("/dashboard?denied=1");
  return ctx;
}
