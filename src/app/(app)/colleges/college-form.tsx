import { ActionForm, FieldRow, TextAreaField, TextField } from "@/components/forms";
import { LinkButton } from "@/components/ui";
import type { ActionState } from "@/lib/actions";
import type { College } from "@/lib/types";

export function CollegeForm({
  action,
  college,
  cancelHref,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  college?: College;
  cancelHref: string;
}) {
  return (
    <ActionForm
      action={action}
      submitLabel={college ? "Save changes" : "Add college"}
      secondary={
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      }
    >
      <FieldRow>
        <TextField
          name="name"
          label="College or university"
          defaultValue={college?.name}
          required
        />
        <TextField
          name="location"
          label="Location"
          placeholder="City, State"
          defaultValue={college?.location}
        />
      </FieldRow>
      <FieldRow>
        <TextField
          name="website_url"
          label="Website"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={college?.website_url}
        />
        <TextField
          name="admissions_url"
          label="Admissions page"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={college?.admissions_url}
        />
      </FieldRow>
      <TextField
        name="estimated_annual_cost"
        label="Estimated annual cost (USD)"
        inputMode="decimal"
        defaultValue={college?.estimated_annual_cost}
        hint="Total cost of attendance before aid — an estimate, not an offer."
      />
      <TextAreaField name="notes" label="Notes" defaultValue={college?.notes} rows={4} />
    </ActionForm>
  );
}
