import { GraduationCap } from "lucide-react";

/** Shown instead of the app when Supabase environment variables are missing. */
export function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-white p-6 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal">
          <GraduationCap size={22} aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Connect Supabase to get started</h1>
        <p className="mt-2 text-sm text-slate-600">
          CollegePath Family needs a Supabase project for sign-in and data. Copy{" "}
          <code className="rounded bg-slate-100 px-1">.env.example</code> to{" "}
          <code className="rounded bg-slate-100 px-1">.env.local</code>, add your project URL and
          publishable key, apply the migrations, and restart the dev server.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Step-by-step instructions are in{" "}
          <code className="rounded bg-slate-100 px-1">docs/SETUP.md</code>.
        </p>
      </div>
    </div>
  );
}
