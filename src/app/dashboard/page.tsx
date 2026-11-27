"use client";
import {
  Award,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Plus,
  Search,
  Settings2,
  Users,
  Menu,
} from "lucide-react";
import { useState } from "react";
const deadlines = [
  {
    student: "Student One",
    title: "Complete college shortlist",
    kind: "College planning",
    date: "Dec 04, 2026",
    days: 7,
    tone: "amber",
  },
  {
    student: "Student Two",
    title: "Review scholarship eligibility",
    kind: "Scholarship",
    date: "Dec 09, 2026",
    days: 12,
    tone: "teal",
  },
  {
    student: "Student One",
    title: "Request teacher recommendation",
    kind: "Application",
    date: "Dec 15, 2026",
    days: 18,
    tone: "blue",
  },
];
const students = [
  {
    name: "Student One",
    year: "Class of 2028",
    focus: "College applications · Scholarship search",
    initials: "S1",
    progress: 36,
    color: "blue",
  },
  {
    name: "Student Two",
    year: "Class of 2030",
    focus: "Academic planning · Activities",
    initials: "S2",
    progress: 18,
    color: "teal",
  },
];
const navItems = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Students", icon: Users },
  { label: "Colleges", icon: GraduationCap },
  { label: "Applications", icon: ClipboardList },
  { label: "Scholarships", icon: Award },
  { label: "Tasks & deadlines", icon: CalendarDays },
];
export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState("Overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={`${mobileOpen ? "fixed inset-0 z-30 flex" : "hidden"} w-full flex-col bg-[#17324f] p-5 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[248px] lg:shrink-0`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="font-semibold tracking-tight">CollegePath</div>
              <div className="text-xs text-blue-100/70">FAMILY WORKSPACE</div>
            </div>
          </div>
          <button
            className="rounded-lg p-2 text-white/80 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <div className="mt-10 text-[10px] font-semibold tracking-[.16em] text-blue-100/50 uppercase">
          Workspace
        </div>
        <nav className="mt-3 space-y-1">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => {
                setActiveNav(label);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${activeNav === label ? "bg-white/14 font-medium text-white" : "text-blue-100/75 hover:bg-white/8 hover:text-white"}`}
            >
              <Icon size={17} />
              {label}
              {label === "Tasks & deadlines" && (
                <span className="ml-auto rounded-full bg-amber-300/20 px-2 py-0.5 text-[10px] text-amber-100">
                  3
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-9 text-[10px] font-semibold tracking-[.16em] text-blue-100/50 uppercase">
          Family
        </div>
        <button
          onClick={() => setActiveNav("Family settings")}
          className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-blue-100/75 hover:bg-white/8"
        >
          <Settings2 size={17} />
          Family settings
        </button>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/7 p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Bell size={15} />
            Stay on track
          </div>
          <p className="mt-2 text-xs leading-5 text-blue-100/70">
            Keep applications, scholarships, and important dates in one shared place.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d5e5e4] text-xs font-semibold text-[#17324f]">
            P
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">Parent account</div>
            <div className="text-xs text-blue-100/60">Family administrator</div>
          </div>
          <ChevronDown size={16} className="text-blue-100/60" />
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e5eaf0] bg-white/90 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="text-xs text-slate-500">Family workspace / {activeNav}</div>
              <div className="text-sm font-semibold text-slate-800">College planning</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 sm:flex">
              <Search size={14} />
              Search
            </button>
            <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600">
              <Bell size={17} />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>
            <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#e5efee] text-xs font-semibold text-[#286a68]">
              P
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1400px] px-5 py-8 md:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-[#237b78]">FRIDAY, NOVEMBER 27, 2026</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#172033] md:text-[30px]">
                Good morning
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Here’s what’s happening across your family’s college plans.
              </p>
            </div>
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#17324f] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#234767]">
              <Plus size={16} />
              Add an item
            </button>
          </div>
          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              icon={GraduationCap}
              label="Colleges exploring"
              value="—"
              note="Build each student’s shortlist"
              accent="blue"
            />
            <Metric
              icon={ClipboardList}
              label="Applications in progress"
              value="—"
              note="Track requirements and status"
              accent="teal"
            />
            <Metric
              icon={Award}
              label="Scholarships to review"
              value="—"
              note="Find and organize opportunities"
              accent="violet"
            />
            <Metric
              icon={CalendarDays}
              label="Upcoming deadlines"
              value="3"
              note="Across both student workspaces"
              accent="amber"
            />
          </section>
          <section className="mt-7 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
            <div className="rounded-2xl border border-[#e5eaf0] bg-white p-5 shadow-[0_2px_10px_rgba(18,38,63,.03)] md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800">Student workspaces</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    A separate plan and progress view for each student.
                  </p>
                </div>
                <button className="text-xs font-medium text-[#237b78]">View all</button>
              </div>
              <div className="mt-5 space-y-3">
                {students.map((s) => (
                  <div
                    key={s.name}
                    className="rounded-xl border border-slate-100 p-4 transition hover:border-slate-200"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${s.color === "blue" ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700"}`}
                      >
                        {s.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-800">{s.name}</h3>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                            {s.year}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{s.focus}</p>
                        <div className="mt-4 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Planning progress</span>
                          <span className="font-semibold text-slate-700">{s.progress}%</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${s.color === "blue" ? "bg-blue-500" : "bg-teal-600"}`}
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                      </div>
                      <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-medium text-slate-600 hover:border-[#237b78] hover:text-[#237b78]">
                <Plus size={14} />
                Add student
              </button>
            </div>
            <div className="rounded-2xl border border-[#e5eaf0] bg-white p-5 shadow-[0_2px_10px_rgba(18,38,63,.03)] md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-800">Upcoming deadlines</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    The next items on your family calendar.
                  </p>
                </div>
                <CalendarDays size={18} className="text-slate-400" />
              </div>
              <div className="mt-5 space-y-4">
                {deadlines.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.tone === "amber" ? "bg-amber-50 text-amber-700" : item.tone === "teal" ? "bg-teal-50 text-teal-700" : "bg-blue-50 text-blue-700"}`}
                    >
                      <CalendarDays size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800">{item.title}</div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {item.student} · {item.kind}
                      </div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">{item.date}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span
                          className={`text-[10px] font-semibold ${item.days <= 7 ? "text-amber-700" : "text-slate-500"}`}
                        >
                          {item.days} days left
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-50 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100">
                View all tasks
                <ChevronRight size={14} />
              </button>
            </div>
          </section>
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#e5eaf0] bg-white p-5 md:p-6">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-[#237b78]" />
                <h2 className="font-semibold text-slate-800">Scholarship pipeline</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Track opportunities from discovery through award decisions.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["Saved", "0"],
                  ["In progress", "0"],
                  ["Submitted", "0"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xl font-semibold text-slate-800">{value}</div>
                    <div className="mt-1 text-[10px] text-slate-500">{label}</div>
                  </div>
                ))}
              </div>
              <button className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#237b78]">
                <Plus size={14} />
                Add scholarship
              </button>
            </div>
            <div className="rounded-2xl border border-[#e5eaf0] bg-white p-5 md:p-6">
              <div className="flex items-center gap-2">
                <CircleDollarSign size={18} className="text-[#237b78]" />
                <h2 className="font-semibold text-slate-800">Award summary</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Keep confirmed awards separate from pending opportunities.
              </p>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="text-2xl font-semibold tracking-tight text-slate-800">$0</div>
                  <div className="mt-1 text-[11px] text-slate-500">Confirmed awards entered</div>
                </div>
                <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                  <CircleDollarSign size={20} />
                </div>
              </div>
              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                No awards recorded yet. Add awards as decisions arrive.
              </div>
            </div>
          </section>
          <p className="mt-8 text-center text-[10px] text-slate-400">
            CollegePath Family · MVP preview · Sample planning data only
          </p>
        </div>
      </main>
    </div>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  note,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  note: string;
  accent: string;
}) {
  const styles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    teal: "bg-teal-50 text-teal-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="rounded-2xl border border-[#e5eaf0] bg-white p-5 shadow-[0_2px_10px_rgba(18,38,63,.03)]">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[accent]}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-700">{label}</div>
      <div className="mt-1 text-[10px] text-slate-400">{note}</div>
    </div>
  );
}
