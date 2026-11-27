import { GraduationCap } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SetupRequired } from "@/components/setup-required";
import { supabaseReady } from "@/lib/supabase/ready";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  if (!(await supabaseReady())) return <SetupRequired />;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/login" className="mb-6 flex items-center gap-3 text-navy">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white">
          <GraduationCap size={22} aria-hidden />
        </div>
        <div>
          <div className="font-semibold tracking-tight">CollegePath Family</div>
          <div className="text-xs text-slate-500">Private family workspace</div>
        </div>
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-sm md:p-8">
        {children}
      </div>
    </div>
  );
}
