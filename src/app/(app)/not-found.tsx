import { SearchX } from "lucide-react";
import { LinkButton } from "@/components/ui";

export default function AppNotFound() {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-line bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        <SearchX size={20} aria-hidden />
      </div>
      <h1 className="mt-4 text-lg font-semibold">Not found</h1>
      <p className="mt-2 text-sm text-slate-600">
        This item doesn&apos;t exist, was deleted, or isn&apos;t shared with your account.
      </p>
      <LinkButton href="/dashboard" className="mt-5">
        Back to overview
      </LinkButton>
    </div>
  );
}
