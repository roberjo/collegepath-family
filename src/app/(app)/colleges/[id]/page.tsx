import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ActionForm,
  ConfirmAction,
  FieldRow,
  InlineAction,
  SelectField,
  TextAreaField,
} from "@/components/forms";
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
import { defaultStudentId, getStudentOptions } from "@/lib/data";
import { INTEREST_LEVELS } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { College, CollegeInterest } from "@/lib/types";
import { deleteCollege, removeInterest, saveInterest, setCollegeArchived } from "../actions";

export const metadata: Metadata = { title: "College · CollegePath Family" };

export default async function CollegePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const supabase = await createClient();
  const [{ data: collegeData }, { data: interestData }, studentOptions] = await Promise.all([
    supabase.from("colleges").select("*").eq("id", id).eq("family_id", ctx.family.id).maybeSingle(),
    supabase.from("college_interests").select("*").eq("college_id", id),
    getStudentOptions(ctx),
  ]);
  if (!collegeData) notFound();
  const college = collegeData as College;
  const interests = (interestData ?? []) as CollegeInterest[];
  const nameOf = (sid: string) => studentOptions.find((s) => s.value === sid)?.label ?? "Student";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<Link href="/colleges">Colleges</Link>}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {college.name}
            {college.archived_at && <Badge tone="amber">Archived</Badge>}
          </span>
        }
        description={college.location ?? undefined}
        actions={
          <LinkButton href={`/colleges/${id}/edit`} variant="secondary">
            <Pencil size={15} aria-hidden /> Edit
          </LinkButton>
        }
      />

      <Card title="Details">
        <DescriptionList
          items={[
            ["Location", college.location],
            [
              "Estimated annual cost",
              college.estimated_annual_cost != null ? money(college.estimated_annual_cost) : null,
            ],
            ["Website", <ExternalLink key="w" href={college.website_url} />],
            ["Admissions", <ExternalLink key="a" href={college.admissions_url} />],
          ]}
        />
        {college.notes && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="text-xs font-medium text-slate-500">Notes</div>
            <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">{college.notes}</p>
          </div>
        )}
      </Card>

      <Card
        title="Student interest"
        description="Which students are considering this college, and how seriously."
      >
        {interests.length > 0 && (
          <ul className="mb-5 divide-y divide-slate-100">
            {interests.map((i) => (
              <li key={i.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Link href={`/students/${i.student_id}`} className="hover:text-teal">
                      {nameOf(i.student_id)}
                    </Link>
                    <StatusBadge options={INTEREST_LEVELS} value={i.interest_level} />
                  </div>
                  {i.notes && <p className="mt-1 text-xs text-slate-500">{i.notes}</p>}
                </div>
                <ConfirmAction
                  action={removeInterest}
                  fields={{ id: i.id, college_id: id }}
                  label="Remove from list"
                  confirmLabel="Remove"
                  variant="secondary"
                />
              </li>
            ))}
          </ul>
        )}
        {studentOptions.length > 0 ? (
          <ActionForm action={saveInterest.bind(null, id)} submitLabel="Save interest">
            <FieldRow>
              <SelectField
                name="student_id"
                label="Student"
                options={studentOptions}
                defaultValue={defaultStudentId(ctx, studentOptions)}
                placeholder="Choose a student"
                required
              />
              <SelectField
                name="interest_level"
                label="Interest level"
                options={INTEREST_LEVELS}
                defaultValue="exploring"
                required
              />
            </FieldRow>
            <TextAreaField name="notes" label="Notes" rows={2} />
          </ActionForm>
        ) : (
          <p className="text-sm text-slate-500">Add a student profile to track interest.</p>
        )}
      </Card>

      <Card title="Manage college">
        <div className="flex flex-wrap items-center gap-3">
          <InlineAction
            action={setCollegeArchived}
            fields={{ id, archive: college.archived_at ? "false" : "true" }}
            label={college.archived_at ? "Restore college" : "Archive college"}
          />
          {ctx.isParent && (
            <ConfirmAction
              action={deleteCollege}
              fields={{ id }}
              label="Delete permanently"
              confirmLabel="Delete college and its applications"
              prompt="This cannot be undone."
            />
          )}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Archive colleges the family is no longer considering. Deleting also removes applications
          to this college.
        </p>
      </Card>
    </div>
  );
}
