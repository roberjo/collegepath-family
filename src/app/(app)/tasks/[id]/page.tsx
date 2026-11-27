import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmAction } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { Task } from "@/lib/types";
import { deleteTask, updateTask } from "../actions";
import { taskFormOptions } from "../form-data";
import { TaskForm } from "../task-form";

export const metadata: Metadata = { title: "Task · CollegePath Family" };

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireFamily();
  const supabase = await createClient();
  const [{ data }, options] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).eq("family_id", ctx.family.id).maybeSingle(),
    taskFormOptions(ctx),
  ]);
  if (!data) notFound();
  const task = data as Task;
  const canDelete = ctx.isParent || task.created_by === ctx.user.id;
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        eyebrow={<Link href="/tasks">Tasks &amp; deadlines</Link>}
        title={task.title}
        description={`Created ${formatDate(task.created_at.slice(0, 10))}${task.completed_at ? ` · completed ${formatDate(task.completed_at.slice(0, 10))}` : ""}`}
      />
      <Card>
        <TaskForm
          action={updateTask.bind(null, id)}
          task={task}
          options={options}
          returnTo="/tasks"
        />
      </Card>
      {canDelete && (
        <Card title="Delete task">
          <ConfirmAction
            action={deleteTask}
            fields={{ id }}
            label="Delete task"
            confirmLabel="Delete"
            prompt="This cannot be undone."
          />
        </Card>
      )}
    </div>
  );
}
