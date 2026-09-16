"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, TriangleAlert } from "lucide-react";

/**
 * Error boundary for the dashboard pages. It renders inside the dashboard
 * shell, so a page that fails leaves the sidebar and header in place and the
 * member can move on, instead of the whole screen becoming the site-wide
 * "Oops" page. The technical detail goes to the console for whoever is
 * debugging; the person on the page gets plain words and a way out.
 */
export default function DashboardError({
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
    <div className="mx-auto max-w-lg px-5 py-10">
      <div
        role="alert"
        className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 text-center dark:border-amber-500/25 dark:bg-amber-500/10 sm:p-8"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm dark:bg-white/10 dark:text-amber-300">
          <TriangleAlert size={26} aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-xl font-black tracking-tight text-gray-900 dark:text-white">
          This page couldn&apos;t load
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-white/65">
          Something on this page didn&apos;t work as expected. Nothing you did caused it. Try again, or
          go back to your home page while we look into it.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-gray-500 dark:text-white/45">
            If you need to tell us about it, quote reference {error.digest}.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-5 text-sm font-bold text-white hover:bg-[#6f0d24]"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-300 px-5 text-sm font-bold text-gray-700 hover:bg-white dark:border-white/15 dark:text-white/80 dark:hover:bg-white/5"
          >
            <Home size={15} aria-hidden="true" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
