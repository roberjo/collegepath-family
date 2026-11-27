import { GraduationCap, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationList } from "@/components/application-list";
import { ConfirmAction, InlineAction } from "@/components/forms";
import { TaskList } from "@/components/task-list";
import { StatusBadge } from "@/components/status-badge";
import {
  Badge,
  Card,
  DescriptionList,
  EmptyState,
  LinkButton,
  money,
  PageHeader,
} from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import {
  getActiveMembers,
  getApplications,
  getScholarshipApplications,
  getTasks,
} from "@/lib/data";
import { todayInZone } from "@/lib/dates";
import { INTEREST_LEVELS, OPPORTUNITY_STATUSES } from "@/lib/options";
import { createClient } from "@/lib/supabase/server";
import type { College, CollegeInterest, Student } from "@/lib/types";
import { deleteStudent, setStudentArchived } from "../actions";

export const metadata: Metadata = { title: "Student · CollegePath Family" };

type InterestRow = CollegeInterest & {
  college: Pick<College, "id" | "name" | "location" | "estimated_annual_cost">;
};

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const supabase = await createClient();
  const today = todayInZone(ctx.family.time_zone);
  const [{ data: studentData }, { data: interestData }, allApplications] = await Promise.all([
    supabase.from("students").select("*").eq("id", id).eq("family_id", ctx.family.id).maybeSingle(),
    supabase
      .from("college_interests")
      .select("*, college:colleges(id, name, location, estimated_annual_cost)")
      .eq("student_id", id),
    getApplications(ctx.family.id),
  ]);
  const applications = allApplications.filter((a) => a.student_id === id);
  const [tracking, allTasks, members, { data: awardData }] = await Promise.all([
    getScholarshipApplications(ctx.family.id),
    getTasks(ctx.family.id),
    getActiveMembers(ctx.family.id),
    supabase.from("awards").select("amount").eq("student_id", id),
  ]);
  const scholarships = tracking.filter((t) => t.student_id === id);
  const tasks = allTasks.filter(
    (t) => t.student_id === id && (t.status === "todo" || t.status === "in_progress"),
  );
  const confirmedTotal = (awardData ?? []).reduce((sum, a) => sum + Number(a.amount), 0);
  if (!studentData) notFound();
  const student = studentData as Student;
  const interests = (interestData ?? []) as InterestRow[];
  const levelOrder = INTEREST_LEVELS.map((l) => l.value).reverse();
  interests.sort(
    (a, b) =>
      levelOrder.indexOf(a.interest_level) - levelOrder.indexOf(b.interest_level) ||
      a.college.name.localeCompare(b.college.name),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<Link href="/students">Students</Link>}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {student.display_name}
            {student.archived_at && <Badge tone="amber">Archived</Badge>}
          </span>
        }
        description={`Class of ${student.graduation_year}`}
        actions={
          <LinkButton href={`/students/${id}/edit`} variant="secondary">
            <Pencil size={15} aria-hidden /> Edit profile
          </LinkButton>
        }
      />

      <Card title="Profile">
        <DescriptionList
          items={[
            ["High school", student.school_name],
            ["Graduation year", student.graduation_year],
            ["GPA", student.gpa?.toFixed(2)],
            ["Intended major", student.intended_major],
          ]}
        />
        {student.notes && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="text-xs font-medium text-slate-500">Notes</div>
            <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">{student.notes}</p>
          </div>
        )}
      </Card>

      <Card
        title="College list"
        description="Colleges this student is considering, by interest level."
        action={
          <LinkButton href={`/colleges?student=${id}`} variant="ghost" size="sm">
            Manage colleges
          </LinkButton>
        }
      >
        {interests.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No colleges yet"
            description="Add colleges to the family list, then mark which ones this student is interested in."
            action={
              <LinkButton href="/colleges" size="sm">
                Go to colleges
              </LinkButton>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {interests.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/colleges/${i.college.id}`}
                    className="text-sm font-medium text-slate-800 hover:text-teal"
                  >
                    {i.college.name}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {[
                      i.college.location,
                      i.college.estimated_annual_cost != null &&
                        `${money(i.college.estimated_annual_cost)}/yr`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <StatusBadge options={INTEREST_LEVELS} value={i.interest_level} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Applications"
        action={
          <LinkButton href={`/applications/new?student=${id}`} variant="ghost" size="sm">
            New application
          </LinkButton>
        }
      >
        <ApplicationList applications={applications} today={today} show="college" />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card
          title="Scholarships"
          description={`Confirmed awards: ${money(confirmedTotal)}`}
          action={
            <LinkButton href={`/scholarships?student=${id}`} variant="ghost" size="sm">
              View all
            </LinkButton>
          }
        >
          {scholarships.length === 0 ? (
            <p className="text-sm text-slate-500">Not tracking any scholarships yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {scholarships.map((t) => (
                <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <Link
                    href={`/scholarships/${t.scholarship_id}`}
                    className="text-sm font-medium text-slate-800 hover:text-teal"
                  >
                    {t.scholarship?.name}
                  </Link>
                  <StatusBadge options={OPPORTUNITY_STATUSES} value={t.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Open tasks"
          action={
            <LinkButton
              href={`/tasks/new?student=${id}&return_to=/students/${id}`}
              variant="ghost"
              size="sm"
            >
              New task
            </LinkButton>
          }
        >
          <TaskList
            tasks={tasks}
            today={today}
            names={{
              students: new Map([[id, student.display_name]]),
              members: new Map(members.map((m) => [m.user_id, m.display_name])),
            }}
            emptyText="No open tasks for this student."
          />
        </Card>
      </div>

      {ctx.isParent && (
        <Card title="Manage profile">
          <div className="flex flex-wrap items-center gap-3">
            {student.archived_at ? (
              <InlineAction
                action={setStudentArchived}
                fields={{ id, archive: "false" }}
                label="Restore student"
              />
            ) : (
              <InlineAction
                action={setStudentArchived}
                fields={{ id, archive: "true" }}
                label="Archive student"
              />
            )}
            <ConfirmAction
              action={deleteStudent}
              fields={{ id }}
              label="Delete permanently"
              confirmLabel="Delete student and all their records"
              prompt="This cannot be undone."
            />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Archiving hides the student from lists and forms but keeps everything. Deleting removes
            their applications, scholarship applications, college list, and awards.
          </p>
        </Card>
      )}
    </div>
  );
}
