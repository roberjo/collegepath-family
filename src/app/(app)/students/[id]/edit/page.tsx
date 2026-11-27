import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/lib/types";
import { updateStudent } from "../../actions";
import { StudentForm } from "../../student-form";

export const metadata: Metadata = { title: "Edit student · CollegePath Family" };

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .eq("family_id", ctx.family.id)
    .maybeSingle();
  if (!data) notFound();
  const student = data as Student;
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title={`Edit ${student.display_name}`} />
      <Card>
        <StudentForm
          action={updateStudent.bind(null, id)}
          student={student}
          cancelHref={`/students/${id}`}
        />
      </Card>
    </div>
  );
}
