import {
  ActionForm,
  FieldRow,
  SelectField,
  TextAreaField,
  TextField,
  type Option,
} from "@/components/forms";
import { LinkButton } from "@/components/ui";
import type { ActionState } from "@/lib/actions";
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/options";
import type { Task } from "@/lib/types";

export interface TaskFormOptions {
  students: Option[];
  members: Option[];
  applications: Option[];
  scholarshipApplications: Option[];
}

export function TaskForm({
  action,
  task,
  defaults,
  options,
  returnTo,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  task?: Task;
  defaults?: Partial<Record<keyof Task, string>>;
  options: TaskFormOptions;
  returnTo: string;
}) {
  const value = (key: keyof Task) => (task?.[key] as string | null | undefined) ?? defaults?.[key];
  return (
    <ActionForm
      action={action}
      submitLabel={task ? "Save task" : "Add task"}
      secondary={
        <LinkButton href={returnTo} variant="secondary">
          Cancel
        </LinkButton>
      }
    >
      <input type="hidden" name="return_to" value={returnTo} />
      <TextField name="title" label="Task" defaultValue={value("title")} required />
      <TextAreaField
        name="description"
        label="Details"
        defaultValue={value("description")}
        rows={3}
      />
      <FieldRow>
        <SelectField
          name="student_id"
          label="For student"
          options={options.students}
          defaultValue={value("student_id")}
          placeholder="Whole family"
        />
        <SelectField
          name="assigned_to"
          label="Assigned to"
          options={options.members}
          defaultValue={value("assigned_to")}
          placeholder="Unassigned"
        />
      </FieldRow>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField name="due_date" label="Due date" type="date" defaultValue={value("due_date")} />
        <SelectField
          name="priority"
          label="Priority"
          options={TASK_PRIORITIES}
          defaultValue={value("priority") ?? "normal"}
          required
        />
        <SelectField
          name="status"
          label="Status"
          options={TASK_STATUSES}
          defaultValue={value("status") ?? "todo"}
          required
        />
        <SelectField
          name="category"
          label="Category"
          options={TASK_CATEGORIES}
          defaultValue={value("category") ?? "general"}
          required
        />
      </div>
      <FieldRow>
        <SelectField
          name="related_application_id"
          label="Related application"
          options={options.applications}
          defaultValue={value("related_application_id")}
          placeholder="None"
        />
        <SelectField
          name="related_scholarship_application_id"
          label="Related scholarship"
          options={options.scholarshipApplications}
          defaultValue={value("related_scholarship_application_id")}
          placeholder="None"
          hint="Linked items must belong to the same student."
        />
      </FieldRow>
    </ActionForm>
  );
}
