import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { safeNextPath } from "@/lib/routes";
import { createTask } from "../actions";
import { taskFormOptions } from "../form-data";
import { TaskForm } from "../task-form";

export const metadata: Metadata = { title: "New task · CollegePath Family" };

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{
    student?: string;
    application?: string;
    scholarship_application?: string;
    return_to?: string;
  }>;
}) {
  const params = await searchParams;
  const ctx = await requireFamily();
  const options = await taskFormOptions(ctx);
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="New task" description="Who is doing what, and by when." />
      <Card>
        <TaskForm
          action={createTask}
          options={options}
          returnTo={safeNextPath(params.return_to, "/tasks")}
          defaults={{
            student_id: params.student ?? ctx.studentId ?? undefined,
            assigned_to: ctx.isParent ? undefined : ctx.user.id,
            related_application_id: params.application,
            related_scholarship_application_id: params.scholarship_application,
          }}
        />
      </Card>
    </div>
  );
}
