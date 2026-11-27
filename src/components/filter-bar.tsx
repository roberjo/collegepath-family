import type { ReactNode } from "react";
import { buttonClass } from "./ui";

/** Plain GET form for list filters: works without JavaScript and keeps filters in the URL. */
export function FilterBar({ children, resetHref }: { children: ReactNode; resetHref: string }) {
  return (
    <form
      method="get"
      className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      {children}
      <div className="flex gap-2">
        <button type="submit" className={buttonClass("secondary")}>
          Apply
        </button>
        <a href={resetHref} className={buttonClass("ghost")}>
          Reset
        </a>
      </div>
    </form>
  );
}

const control =
  "mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 sm:w-48";

export function FilterSelect({
  name,
  label,
  value,
  options,
  allLabel = "All",
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  return (
    <label className="text-xs font-medium text-slate-600">
      {label}
      <select name={name} defaultValue={value ?? ""} className={control}>
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterSearch({ value, placeholder }: { value?: string; placeholder: string }) {
  return (
    <label className="text-xs font-medium text-slate-600">
      Search
      <input
        type="search"
        name="q"
        defaultValue={value}
        placeholder={placeholder}
        className={control}
      />
    </label>
  );
}
