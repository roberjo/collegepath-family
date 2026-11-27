"use client";

import {
  Award,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { cn } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const WORKSPACE_NAV: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/colleges", label: "Colleges", icon: GraduationCap },
  { href: "/applications", label: "Applications", icon: ClipboardList },
  { href: "/scholarships", label: "Scholarships", icon: Award },
  { href: "/awards", label: "Awards", icon: Trophy },
  { href: "/tasks", label: "Tasks & deadlines", icon: CalendarDays },
];

const FAMILY_NAV: NavItem[] = [{ href: "/settings", label: "Family settings", icon: Settings2 }];

export function AppShell({
  familyName,
  memberName,
  roleLabel,
  enabledRoutes,
  children,
}: {
  familyName: string;
  memberName: string;
  roleLabel: string;
  /** Routes implemented so far; others are hidden from navigation. */
  enabledRoutes: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const current = [...WORKSPACE_NAV, ...FAMILY_NAV].find((item) => isActive(item.href));
  const visible = (items: NavItem[]) => items.filter((i) => enabledRoutes.includes(i.href));

  const navLink = ({ href, label, icon: Icon }: NavItem) => (
    <Link
      key={href}
      href={href}
      aria-current={isActive(href) ? "page" : undefined}
      onClick={() => setOpen(false)}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
        isActive(href)
          ? "bg-white/15 font-medium text-white"
          : "text-blue-100/80 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon size={17} aria-hidden />
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen lg:flex">
      <a
        href="#main"
        className="sr-only z-50 rounded bg-white px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <aside
        className={cn(
          open ? "fixed inset-0 z-30 flex" : "hidden",
          "w-full flex-col overflow-y-auto bg-navy p-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[248px] lg:shrink-0",
        )}
        aria-label="Main navigation"
      >
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <GraduationCap size={22} aria-hidden />
            </div>
            <div>
              <div className="font-semibold tracking-tight">CollegePath</div>
              <div className="max-w-[150px] truncate text-xs text-blue-100/70">{familyName}</div>
            </div>
          </Link>
          <button
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <div className="mt-10 text-[10px] font-semibold tracking-[.16em] text-blue-100/60 uppercase">
          Workspace
        </div>
        <nav className="mt-3 space-y-1">{visible(WORKSPACE_NAV).map(navLink)}</nav>

        <div className="mt-9 text-[10px] font-semibold tracking-[.16em] text-blue-100/60 uppercase">
          Family
        </div>
        <nav className="mt-3 space-y-1">{visible(FAMILY_NAV).map(navLink)}</nav>

        <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d5e5e4] text-xs font-semibold text-navy"
            aria-hidden
          >
            {memberName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{memberName}</div>
            <div className="text-xs text-blue-100/70">{roleLabel}</div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg p-2 text-blue-100/80 hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={16} aria-hidden />
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-5 backdrop-blur md:px-8">
          <button
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
          >
            <Menu size={20} aria-hidden />
          </button>
          <div className="min-w-0">
            <div className="truncate text-xs text-slate-500">
              {familyName} / {current?.label ?? "Workspace"}
            </div>
            <div className="text-sm font-semibold text-slate-800">College planning</div>
          </div>
        </header>
        <main id="main" className="mx-auto max-w-[1400px] px-5 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
