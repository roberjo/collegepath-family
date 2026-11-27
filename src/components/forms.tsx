"use client";

import { Check, Copy } from "lucide-react";
import { createContext, useActionState, useContext, useId, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/actions";
import { buttonClass, cn, Notice } from "./ui";

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const FormStateContext = createContext<ActionState>({});

/**
 * Wraps a server action with useActionState, shows form-level errors, and lets
 * the field components below show per-field errors and keep entered values.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  pendingLabel = "Saving…",
  secondary,
  className,
  resultLabel,
}: {
  action: FormAction;
  children: ReactNode;
  submitLabel?: string;
  pendingLabel?: string;
  secondary?: ReactNode;
  className?: string;
  /** When the action returns `result`, show it as a copyable field with this label. */
  resultLabel?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <FormStateContext.Provider value={state}>
      <form action={formAction} className={cn("space-y-4", className)} noValidate>
        {state.error && <Notice tone="red">{state.error}</Notice>}
        {state.message && <Notice tone="teal">{state.message}</Notice>}
        {state.result && resultLabel && <CopyField label={resultLabel} value={state.result} />}
        {children}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <SubmitButton label={submitLabel} pendingLabel={pendingLabel} />
          {secondary}
        </div>
      </form>
    </FormStateContext.Provider>
  );
}

export function SubmitButton({
  label,
  pendingLabel,
  variant = "primary",
  size = "md",
}: {
  label: string;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={buttonClass(variant, size)}>
      {pending ? (pendingLabel ?? label) : label}
    </button>
  );
}

function useField(name: string, defaultValue?: string | number | null) {
  const state = useContext(FormStateContext);
  const id = useId();
  const value = state.values?.[name] ?? (defaultValue == null ? "" : String(defaultValue));
  return { id, error: state.fieldErrors?.[name], value };
}

const inputClass = (error?: string) =>
  cn(
    "mt-1.5 block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm placeholder:text-slate-400",
    error ? "border-rose-400" : "border-slate-300",
  );

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({
  name,
  label,
  type = "text",
  defaultValue,
  required,
  placeholder,
  hint,
  autoComplete,
  inputMode,
  step,
  min,
  max,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  inputMode?: "text" | "decimal" | "numeric" | "email" | "url";
  step?: string;
  min?: string | number;
  max?: string | number;
}) {
  const { id, error, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={type === "password" ? undefined : value}
        key={type === "password" ? undefined : value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        step={step}
        min={min}
        max={max}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={inputClass(error)}
      />
    </FieldShell>
  );
}

export function TextAreaField({
  name,
  label,
  defaultValue,
  rows = 3,
  hint,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
  hint?: string;
  placeholder?: string;
}) {
  const { id, error, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={value}
        key={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={inputClass(error)}
      />
    </FieldShell>
  );
}

export interface Option {
  value: string;
  label: string;
}

export function SelectField({
  name,
  label,
  options,
  defaultValue,
  required,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  options: Option[];
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  const { id, error, value } = useField(name, defaultValue);
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        name={name}
        defaultValue={value}
        key={value}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={inputClass(error)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
  hint,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  const state = useContext(FormStateContext);
  const id = useId();
  const checked = state.values ? state.values[name] === "on" : Boolean(defaultChecked);
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={checked}
        key={String(checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal"
      />
      <div>
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

/** A grid wrapper so related fields sit side by side on wider screens. */
export function FieldRow({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/**
 * Two-step destructive/irreversible action without a browser confirm()
 * dialog: the first click reveals Confirm/Cancel.
 */
export function ConfirmAction({
  action,
  label,
  confirmLabel = "Confirm",
  fields,
  variant = "danger",
  prompt,
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  confirmLabel?: string;
  fields?: Record<string, string>;
  variant?: "danger" | "secondary";
  prompt?: string;
}) {
  const [armed, setArmed] = useState(false);
  if (!armed) {
    return (
      <button type="button" className={buttonClass(variant, "sm")} onClick={() => setArmed(true)}>
        {label}
      </button>
    );
  }
  return (
    <form action={action} className="inline-flex flex-wrap items-center gap-2">
      {prompt && <span className="text-xs text-slate-600">{prompt}</span>}
      {Object.entries(fields ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton label={confirmLabel} variant={variant} size="sm" />
      <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setArmed(false)}>
        Cancel
      </button>
    </form>
  );
}

/** Small inline form button for non-destructive one-click actions. */
export function InlineAction({
  action,
  label,
  fields,
  variant = "secondary",
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  fields?: Record<string, string>;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <form action={action} className="inline">
      {Object.entries(fields ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <SubmitButton label={label} variant={variant} size="sm" />
    </form>
  );
}

export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={id}
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className={cn(inputClass(), "mt-0 font-mono text-xs")}
        />
        <button
          type="button"
          className={buttonClass("secondary")}
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
