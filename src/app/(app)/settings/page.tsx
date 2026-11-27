import { Mail, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import {
  ActionForm,
  ConfirmAction,
  FieldRow,
  InlineAction,
  SelectField,
  TextField,
} from "@/components/forms";
import { Badge, buttonClass, Card, DescriptionList, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { ROLE_LABEL, ROLE_OPTIONS, timeZoneOptions } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { FamilyInvitation, FamilyMember, Student } from "@/lib/types";
import {
  createInvitation,
  revokeInvitation,
  setMemberStatus,
  updateFamily,
  updateMember,
} from "./actions";

export const metadata: Metadata = { title: "Family settings · CollegePath Family" };

function inviteState(invite: FamilyInvitation): { label: string; tone: "teal" | "gray" | "amber" } {
  if (invite.accepted_at) return { label: "Accepted", tone: "teal" };
  if (invite.revoked_at) return { label: "Cancelled", tone: "gray" };
  if (new Date(invite.expires_at) < new Date()) return { label: "Expired", tone: "amber" };
  return { label: "Pending", tone: "amber" };
}

export default async function SettingsPage() {
  const ctx = await requireFamily();
  const supabase = await createClient();
  const [{ data: members }, { data: students }, { data: invites }] = await Promise.all([
    supabase
      .from("family_members")
      .select("*")
      .eq("family_id", ctx.family.id)
      .order("status")
      .order("created_at"),
    supabase
      .from("students")
      .select("id, display_name, archived_at")
      .eq("family_id", ctx.family.id)
      .order("display_name"),
    ctx.isParent
      ? supabase
          .from("family_invitations")
          .select("*")
          .eq("family_id", ctx.family.id)
          .order("created_at", { ascending: false })
          .limit(20)
      : Promise.resolve({ data: [] }),
  ]);

  const memberList = (members ?? []) as FamilyMember[];
  const studentList = (students ?? []) as Pick<Student, "id" | "display_name" | "archived_at">[];
  const inviteList = (invites ?? []) as FamilyInvitation[];
  const studentName = (id: string | null) =>
    studentList.find((s) => s.id === id)?.display_name ?? null;
  const studentOptions = studentList
    .filter((s) => !s.archived_at)
    .map((s) => ({ value: s.id, label: s.display_name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family settings"
        description="Family details, members, roles, and invitations."
      />

      <Card title="Family details">
        {ctx.isParent ? (
          <ActionForm action={updateFamily} submitLabel="Save details">
            <FieldRow>
              <TextField name="name" label="Family name" defaultValue={ctx.family.name} required />
              <SelectField
                name="time_zone"
                label="Time zone"
                options={timeZoneOptions(ctx.family.time_zone)}
                defaultValue={ctx.family.time_zone}
                hint="Deadlines are compared against today in this time zone."
                required
              />
            </FieldRow>
          </ActionForm>
        ) : (
          <DescriptionList
            items={[
              ["Family name", ctx.family.name],
              ["Time zone", ctx.family.time_zone],
            ]}
          />
        )}
      </Card>

      <Card title="Members" description="Everyone with access to this workspace.">
        <ul className="divide-y divide-slate-100">
          {memberList.map((m) => {
            const isSelf = m.user_id === ctx.user.id;
            return (
              <li key={m.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {m.display_name}
                        {isSelf && <span className="font-normal text-slate-500"> (you)</span>}
                      </span>
                      <Badge tone={m.role === "parent" ? "blue" : "teal"}>
                        {ROLE_LABEL[m.role]}
                      </Badge>
                      {m.status === "removed" && <Badge tone="red">Access removed</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {m.email}
                      {m.role === "student" &&
                        ` · ${studentName(m.student_id) ? `Linked to ${studentName(m.student_id)}` : "Not linked to a student profile"}`}
                    </div>
                  </div>
                  {ctx.isParent && !isSelf && (
                    <div className="flex flex-wrap gap-2">
                      {m.status === "active" ? (
                        <ConfirmAction
                          action={setMemberStatus}
                          fields={{ id: m.id, status: "removed" }}
                          label="Remove access"
                          confirmLabel="Remove"
                          prompt={`Remove ${m.display_name}?`}
                        />
                      ) : (
                        <InlineAction
                          action={setMemberStatus}
                          fields={{ id: m.id, status: "active" }}
                          label="Restore access"
                        />
                      )}
                    </div>
                  )}
                </div>
                {ctx.isParent && m.status === "active" && !isSelf && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-teal">
                      Change role or student link
                    </summary>
                    <div className="mt-3 max-w-xl">
                      <ActionForm
                        action={updateMember.bind(null, m.id)}
                        submitLabel="Update member"
                      >
                        <FieldRow>
                          <SelectField
                            name="role"
                            label="Role"
                            options={ROLE_OPTIONS}
                            defaultValue={m.role}
                          />
                          <SelectField
                            name="student_id"
                            label="Student profile (students only)"
                            options={studentOptions}
                            defaultValue={m.student_id}
                            placeholder="Not linked"
                          />
                        </FieldRow>
                      </ActionForm>
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {ctx.isParent && (
        <Card
          title="Export data"
          description="Download a copy of everything in the workspace for safekeeping or spreadsheets. See docs/OPERATIONS.md for backup guidance."
        >
          <div className="flex flex-wrap gap-2">
            <a href="/export/all.json" className={buttonClass("secondary", "sm")} download>
              Everything (JSON)
            </a>
            {[
              ["students", "Students"],
              ["colleges", "Colleges"],
              ["applications", "Applications"],
              ["application_requirements", "Requirements"],
              ["scholarships", "Scholarships"],
              ["scholarship_applications", "Scholarship tracking"],
              ["tasks", "Tasks"],
              ["awards", "Awards"],
            ].map(([table, label]) => (
              <a
                key={table}
                href={`/export/${table}.csv`}
                className={buttonClass("ghost", "sm")}
                download
              >
                {label} (CSV)
              </a>
            ))}
          </div>
        </Card>
      )}

      {ctx.isParent && (
        <Card
          title={
            <span className="flex items-center gap-2">
              <UserPlus size={18} className="text-teal" aria-hidden /> Invite a family member
            </span>
          }
          description="Creates a private link to send by text or email. The person signs in with the invited address to join."
        >
          <ActionForm
            action={createInvitation}
            submitLabel="Create invitation link"
            pendingLabel="Creating…"
            resultLabel="Invitation link"
          >
            <FieldRow>
              <TextField name="email" label="Email" type="email" autoComplete="off" required />
              <TextField name="display_name" label="Name (optional)" autoComplete="off" />
            </FieldRow>
            <FieldRow>
              <SelectField
                name="role"
                label="Role"
                options={ROLE_OPTIONS}
                defaultValue="student"
                required
              />
              <SelectField
                name="student_id"
                label="Link to student profile"
                options={studentOptions}
                placeholder={studentOptions.length ? "Choose later" : "No student profiles yet"}
                hint="For student invitations. You can also link later."
              />
            </FieldRow>
          </ActionForm>

          {inviteList.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h3 className="text-sm font-semibold text-slate-700">Recent invitations</h3>
              <ul className="mt-3 space-y-3">
                {inviteList.map((invite) => {
                  const state = inviteState(invite);
                  return (
                    <li
                      key={invite.id}
                      className="flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="flex min-w-0 items-center gap-2 text-sm">
                        <Mail size={14} className="shrink-0 text-slate-400" aria-hidden />
                        <span className="truncate">{invite.email}</span>
                        <Badge tone={state.tone}>{state.label}</Badge>
                        <span className="text-xs text-slate-500">
                          {ROLE_LABEL[invite.role]} · sent {formatDate(invite.created_at)}
                        </span>
                      </div>
                      {state.label === "Pending" && (
                        <ConfirmAction
                          action={revokeInvitation}
                          fields={{ id: invite.id }}
                          label="Cancel"
                          confirmLabel="Cancel invitation"
                          variant="secondary"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
