import Link from "next/link";
import type { ComponentProps, ElementType, ReactNode } from "react";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function buttonClass(variant: Variant = "primary", size: "sm" | "md" = "md"): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
    size === "md" ? "px-4 py-2.5 text-sm" : "px-3 py-1.5 text-xs",
    variant === "primary" && "bg-navy text-white shadow-sm hover:bg-navy-700",
    variant === "secondary" && "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    variant === "ghost" && "text-teal hover:bg-teal-50",
    variant === "danger" && "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: "sm" | "md" }) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold tracking-wide text-teal uppercase">{eyebrow}</p>
        )}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink md:text-[28px]">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-line bg-white p-5 shadow-[0_2px_10px_rgba(18,38,63,.03)] md:p-6",
        className,
      )}
    >
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-semibold text-slate-800">{title}</h2>}
            {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      {Icon && (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal">
          <Icon size={20} aria-hidden />
        </div>
      )}
      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export type Tone = "gray" | "blue" | "teal" | "amber" | "red" | "violet" | "green";

const toneClass: Record<Tone, string> = {
  gray: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-800",
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-rose-50 text-rose-800",
  violet: "bg-violet-50 text-violet-800",
  green: "bg-emerald-50 text-emerald-800",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Notice({
  tone = "teal",
  children,
}: {
  tone?: "teal" | "amber" | "red";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "red" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        tone === "teal" && "border-teal/20 bg-teal-50 text-teal-700",
        tone === "amber" && "border-amber-200 bg-amber-50 text-amber-900",
        tone === "red" && "border-rose-200 bg-rose-50 text-rose-800",
      )}
    >
      {children}
    </div>
  );
}

export function DescriptionList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-slate-500">{label}</dt>
          <dd className="mt-1 text-sm break-words text-slate-800">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ExternalLink({ href, children }: { href: string | null; children?: ReactNode }) {
  if (!href) return <>—</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-teal underline-offset-2 hover:underline"
    >
      {children ?? href.replace(/^https?:\/\//, "").replace(/\/$/, "")}
    </a>
  );
}

export function ListItemLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-100 p-4 transition hover:border-slate-300 hover:bg-slate-50/50"
    >
      {children}
    </Link>
  );
}

export function money(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}
