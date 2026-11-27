import type { Metadata } from "next";
import { Card, EmptyState, LinkButton, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { defaultStudentId, getColleges, getStudentOptions } from "@/lib/data";
import { createApplication } from "../actions";
import { ApplicationForm } from "../application-form";

export const metadata: Metadata = { title: "New application · CollegePath Family" };

export default async function NewApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; college?: string }>;
}) {
  const params = await searchParams;
  const ctx = await requireFamily();
  const [students, colleges] = await Promise.all([
    getStudentOptions(ctx),
    getColleges(ctx.family.id),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="New application"
        description="Track one application round for one student and college."
      />
      {students.length === 0 || colleges.length === 0 ? (
        <EmptyState
          title={students.length === 0 ? "Add a student first" : "Add a college first"}
          description="Applications connect a student with a college."
          action={
            <LinkButton href={students.length === 0 ? "/students" : "/colleges/new"}>
              {students.length === 0 ? "Go to students" : "Add a college"}
            </LinkButton>
          }
        />
      ) : (
        <Card>
          <ApplicationForm
            action={createApplication}
            students={students}
            colleges={colleges.map((c) => ({ value: c.id, label: c.name }))}
            defaults={{
              student_id: params.student ?? defaultStudentId(ctx, students),
              college_id: params.college,
            }}
            cancelHref="/applications"
          />
        </Card>
      )}
    </div>
  );
}
