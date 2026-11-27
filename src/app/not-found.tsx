import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-5">
      <div className="text-center">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <Link href="/dashboard" className="mt-3 inline-block text-sm text-teal hover:underline">
          Go to your workspace
        </Link>
      </div>
    </div>
  );
}
