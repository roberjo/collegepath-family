import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { requireParent } from "@/lib/auth";
import { createStudent } from "../actions";
import { StudentForm } from "../student-form";

export const metadata: Metadata = { title: "Add student · CollegePath Family" };

export default async function NewStudentPage() {
  await requireParent();
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Add a student" description="You can change any of this later." />
      <Card>
        <StudentForm action={createStudent} cancelHref="/students" />
      </Card>
    </div>
  );
}
