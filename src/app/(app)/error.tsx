"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { buttonClass } from "@/components/ui";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
        <AlertTriangle size={20} aria-hidden />
      </div>
      <h1 className="mt-4 text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600">
        The page couldn&apos;t load. Your data is safe — try again, and if it keeps happening, sign
        out and back in.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-slate-400">Ref: {error.digest}</p>
      )}
      <button type="button" onClick={reset} className={`${buttonClass()} mt-5`}>
        Try again
      </button>
    </div>
  );
}
