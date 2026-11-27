import { Check, Pencil, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActionForm,
  ConfirmAction,
  FieldRow,
  SelectField,
  SubmitButton,
  TextAreaField,
  TextField,
} from "@/components/forms";
import { Due } from "@/components/due";
import { Progress } from "@/components/progress";
import { StatusBadge } from "@/components/status-badge";
import {
  Badge,
  Card,
  DescriptionList,
  ExternalLink,
  LinkButton,
  PageHeader,
} from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { CLOSED_APPLICATION_STATUSES } from "@/lib/data";
import { formatDate, todayInZone } from "@/lib/dates";
import {
  APPLICATION_STATUSES,
  APPLICATION_TYPES,
  labelFor,
  REQUIREMENT_TYPES,
} from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { Application, ApplicationRequirement } from "@/lib/types";
import {
  addRequirement,
  deleteApplication,
  deleteRequirement,
  setApplicationStatus,
  toggleRequirement,
} from "../actions";

export const metadata: Metadata = { title: "Application · CollegePath Family" };

type Detail = Application & {
  college: { id: string; name: string } | null;
  student: { id: string; display_name: string } | null;
};

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const today = todayInZone(ctx.family.time_zone);
  const supabase = await createClient();
  const [{ data }, { data: reqData }] = await Promise.all([
    supabase
      .from("applications")
      .select("*, college:colleges(id, name), student:students(id, display_name)")
      .eq("id", id)
      .eq("family_id", ctx.family.id)
      .maybeSingle(),
    supabase
      .from("application_requirements")
      .select("*")
      .eq("application_id", id)
      .order("is_complete")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at"),
  ]);
  if (!data) notFound();
  const app = data as Detail;
  const requirements = (reqData ?? []) as ApplicationRequirement[];
  const done = requirements.filter((r) => r.is_complete).length;
  const open = !CLOSED_APPLICATION_STATUSES.includes(app.status);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<Link href="/applications">Applications</Link>}
        title={app.college?.name ?? "Application"}
        description={
          <>
            <Link href={`/students/${app.student_id}`} className="hover:text-teal">
              {app.student?.display_name}
            </Link>{" "}
            · {labelFor(APPLICATION_TYPES, app.application_type)}
          </>
        }
        actions={
          <LinkButton href={`/applications/${id}/edit`} variant="secondary">
            <Pencil size={15} aria-hidden /> Edit
          </LinkButton>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_1.3fr]">
        <Card title="Overview">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <StatusBadge options={APPLICATION_STATUSES} value={app.status} />
            <Due date={app.application_deadline} today={today} done={!open} />
          </div>
          <form action={setApplicationStatus} className="mb-5 flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={id} />
            <label className="text-xs font-medium text-slate-600">
              Update status
              <select
                name="status"
                defaultValue={app.status}
                key={app.status}
                className="mt-1 block rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {APPLICATION_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton label="Update" variant="secondary" size="sm" />
          </form>
          <DescriptionList
            items={[
              ["Deadline", formatDate(app.application_deadline)],
              ["Submitted", formatDate(app.submitted_on)],
              ["Decision date", formatDate(app.decision_date)],
              ["Portal", <ExternalLink key="p" href={app.portal_url} />],
            ]}
          />
          {app.notes && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="text-xs font-medium text-slate-500">Notes</div>
              <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">{app.notes}</p>
            </div>
          )}
        </Card>

        <Card
          title="Requirements checklist"
          description="Essays, recommendations, transcripts, test scores, and forms."
        >
          {requirements.length > 0 && (
            <div className="mb-4">
              <Progress done={done} total={requirements.length} label="Complete" />
            </div>
          )}
          <ul className="divide-y divide-slate-100">
            {requirements.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start gap-3 py-3">
                <form action={toggleRequirement}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="application_id" value={id} />
                  <input type="hidden" name="complete" value={String(!r.is_complete)} />
                  <button
                    type="submit"
                    aria-label={
                      r.is_complete ? `Mark “${r.title}” not done` : `Mark “${r.title}” done`
                    }
                    className={
                      r.is_complete
                        ? "flex h-6 w-6 items-center justify-center rounded-md bg-teal text-white"
                        : "flex h-6 w-6 items-center justify-center rounded-md border-2 border-slate-300 text-transparent hover:border-teal hover:text-teal"
                    }
                  >
                    <Check size={14} aria-hidden />
                  </button>
                </form>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        r.is_complete
                          ? "text-sm text-slate-400 line-through"
                          : "text-sm font-medium text-slate-800"
                      }
                    >
                      {r.title}
                    </span>
                    <Badge>{labelFor(REQUIREMENT_TYPES, r.requirement_type)}</Badge>
                    {r.is_complete && <span className="sr-only">(done)</span>}
                  </div>
                  <div className="mt-1">
                    {r.is_complete ? (
                      <span className="text-xs text-slate-400">
                        Done {r.completed_at ? formatDate(r.completed_at.slice(0, 10)) : ""}
                      </span>
                    ) : (
                      <Due date={r.due_date} today={today} />
                    )}
                  </div>
                  {r.notes && <p className="mt-1 text-xs text-slate-500">{r.notes}</p>}
                </div>
                <ConfirmAction
                  action={deleteRequirement}
                  fields={{ id: r.id, application_id: id }}
                  label="Remove"
                  confirmLabel="Remove"
                  variant="secondary"
                />
              </li>
            ))}
          </ul>
          {requirements.length === 0 && (
            <p className="mb-4 text-sm text-slate-500">
              No requirements yet. Add each item the application needs.
            </p>
          )}

          <details
            className="mt-4 rounded-xl border border-slate-200 p-4"
            open={requirements.length === 0}
          >
            <summary className="cursor-pointer text-sm font-medium text-teal">
              Add a requirement
            </summary>
            <div className="mt-4">
              <ActionForm action={addRequirement.bind(null, id)} submitLabel="Add requirement">
                <TextField
                  name="title"
                  label="Requirement"
                  placeholder="e.g. Personal essay"
                  required
                />
                <FieldRow>
                  <SelectField
                    name="requirement_type"
                    label="Type"
                    options={REQUIREMENT_TYPES}
                    defaultValue="essay"
                    required
                  />
                  <TextField name="due_date" label="Due date" type="date" />
                </FieldRow>
                <TextAreaField name="notes" label="Notes" rows={2} />
              </ActionForm>
            </div>
          </details>
        </Card>
      </div>

      {ctx.isParent && (
        <Card title="Manage application">
          <ConfirmAction
            action={deleteApplication}
            fields={{ id }}
            label="Delete application"
            confirmLabel="Delete application and checklist"
            prompt="This cannot be undone."
          />
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500">
            <RotateCcw size={12} aria-hidden /> To stop tracking without deleting, set the status to
            Withdrawn.
          </p>
        </Card>
      )}
    </div>
  );
}
