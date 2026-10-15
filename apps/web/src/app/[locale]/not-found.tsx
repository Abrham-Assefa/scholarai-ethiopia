"use client";

import { Link } from "@/i18n/routing";

export default function LocaleNotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
        <span className="text-xl font-bold">404</span>
      </div>
      <h1 className="mt-4 text-2xl font-bold">Page Not Found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We couldn't find the page you were looking for.
      </p>
      <Link
        href="/"
        className="mt-5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
