import { Pencil, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActionForm,
  ConfirmAction,
  InlineAction,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/forms";
import { Due } from "@/components/due";
import { StatusBadge } from "@/components/status-badge";
import {
  Badge,
  Card,
  DescriptionList,
  ExternalLink,
  LinkButton,
  money,
  PageHeader,
} from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { getStudentOptions } from "@/lib/data";
import { formatDate, todayInZone } from "@/lib/dates";
import { OPPORTUNITY_STATUSES } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { Scholarship, ScholarshipApplication } from "@/lib/types";
import {
  deleteScholarship,
  setScholarshipArchived,
  trackScholarship,
  untrackScholarship,
  updateTracking,
} from "../actions";

export const metadata: Metadata = { title: "Scholarship · CollegePath Family" };

export default async function ScholarshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const today = todayInZone(ctx.family.time_zone);
  const supabase = await createClient();
  const [{ data }, { data: trackingData }, { data: awardData }, students] = await Promise.all([
    supabase
      .from("scholarships")
      .select("*")
      .eq("id", id)
      .eq("family_id", ctx.family.id)
      .maybeSingle(),
    supabase.from("scholarship_applications").select("*").eq("scholarship_id", id),
    supabase
      .from("awards")
      .select("scholarship_application_id")
      .not("scholarship_application_id", "is", null),
    getStudentOptions(ctx),
  ]);
  if (!data) notFound();
  const scholarship = data as Scholarship;
  const tracking = (trackingData ?? []) as ScholarshipApplication[];
  const recorded = new Set((awardData ?? []).map((a) => a.scholarship_application_id as string));
  const untracked = students.filter((s) => !tracking.some((t) => t.student_id === s.value));
  const nameOf = (sid: string) => students.find((s) => s.value === sid)?.label ?? "Student";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<Link href="/scholarships">Scholarships</Link>}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {scholarship.name}
            {scholarship.archived_at && <Badge tone="amber">Archived</Badge>}
          </span>
        }
        description={scholarship.sponsor ?? undefined}
        actions={
          <LinkButton href={`/scholarships/${id}/edit`} variant="secondary">
            <Pencil size={15} aria-hidden /> Edit
          </LinkButton>
        }
      />

      <Card title="Opportunity">
        <div className="mb-4">
          <Due date={scholarship.deadline} today={today} />
        </div>
        <DescriptionList
          items={[
            [
              "Amount",
              scholarship.award_amount != null
                ? `${money(scholarship.award_amount)}${scholarship.renewable ? " (renewable)" : ""}`
                : null,
            ],
            ["Opens", formatDate(scholarship.opens_on)],
            ["Deadline", formatDate(scholarship.deadline)],
            ["Apply", <ExternalLink key="a" href={scholarship.application_url} />],
            ["Source", <ExternalLink key="s" href={scholarship.source_url} />],
          ]}
        />
        {scholarship.eligibility_notes && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="text-xs font-medium text-slate-500">Eligibility</div>
            <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">
              {scholarship.eligibility_notes}
            </p>
          </div>
        )}
        {scholarship.description && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="text-xs font-medium text-slate-500">Description and notes</div>
            <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">
              {scholarship.description}
            </p>
          </div>
        )}
      </Card>

      <Card
        title="Student tracking"
        description="Each student's own status and outcome for this opportunity."
      >
        <div className="space-y-5">
          {tracking.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/students/${t.student_id}`}
                    className="text-sm font-semibold text-slate-800 hover:text-teal"
                  >
                    {nameOf(t.student_id)}
                  </Link>
                  <StatusBadge options={OPPORTUNITY_STATUSES} value={t.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {ctx.isParent && t.status === "awarded" && !recorded.has(t.id) && (
                    <LinkButton
                      size="sm"
                      href={`/awards/new?student=${t.student_id}&scholarship_application=${t.id}&name=${encodeURIComponent(scholarship.name)}${t.awarded_amount != null ? `&amount=${t.awarded_amount}` : ""}`}
                    >
                      Record confirmed award
                    </LinkButton>
                  )}
                  {recorded.has(t.id) && <Badge tone="green">Award recorded</Badge>}
                  {ctx.isParent && (
                    <ConfirmAction
                      action={untrackScholarship}
                      fields={{ id: t.id }}
                      label="Stop tracking"
                      confirmLabel="Stop tracking"
                      variant="secondary"
                    />
                  )}
                </div>
              </div>
              <ActionForm action={updateTracking.bind(null, t.id)} submitLabel="Save">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SelectField
                    name="status"
                    label="Status"
                    options={OPPORTUNITY_STATUSES}
                    defaultValue={t.status}
                    required
                  />
                  <TextField
                    name="submitted_on"
                    label="Submitted"
                    type="date"
                    defaultValue={t.submitted_on}
                  />
                  <TextField
                    name="decision_date"
                    label="Decision"
                    type="date"
                    defaultValue={t.decision_date}
                  />
                  <TextField
                    name="awarded_amount"
                    label="Amount awarded"
                    inputMode="decimal"
                    defaultValue={t.awarded_amount}
                  />
                </div>
                <TextAreaField name="notes" label="Notes" rows={2} defaultValue={t.notes} />
              </ActionForm>
            </div>
          ))}
          {tracking.length === 0 && (
            <p className="text-sm text-slate-500">No student is tracking this scholarship yet.</p>
          )}
          {untracked.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {untracked.map((s) => (
                <InlineAction
                  key={s.value}
                  action={trackScholarship}
                  fields={{ scholarship_id: id, student_id: s.value }}
                  label={`Track for ${s.label}`}
                />
              ))}
            </div>
          )}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
          <Plus size={12} aria-hidden /> An &ldquo;Awarded&rdquo; status is not counted as aid until
          a parent records the confirmed award.
        </p>
      </Card>

      <Card title="Manage scholarship">
        <div className="flex flex-wrap items-center gap-3">
          <InlineAction
            action={setScholarshipArchived}
            fields={{ id, archive: scholarship.archived_at ? "false" : "true" }}
            label={scholarship.archived_at ? "Restore scholarship" : "Archive scholarship"}
          />
          {ctx.isParent && (
            <ConfirmAction
              action={deleteScholarship}
              fields={{ id }}
              label="Delete permanently"
              confirmLabel="Delete scholarship and tracking"
              prompt="This cannot be undone."
            />
          )}
        </div>
      </Card>
    </div>
  );
}
