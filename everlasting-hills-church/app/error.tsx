"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, Home } from "lucide-react";

/**
 * Route-segment error boundary. Catches runtime errors in the app and offers a
 * recovery path. Logged to the console (and to Sentry once wired on the client).
 */
export default function Error({
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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-church-dark px-5 text-center text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-[-10%] top-[-20%] h-[60%] w-[60%] rounded-full bg-[#87102C]/15 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[#87102C]/10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg">
        <p className="font-display text-6xl font-black text-[#87102C] sm:text-7xl">
          Oops
        </p>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mx-auto mt-4 max-w-md text-white/55">
          An unexpected error occurred. You can try again, or head back home.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-white/30">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-[#87102C] px-7 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-[#6E0C24]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-7 py-3.5 text-sm font-semibold transition-colors hover:bg-white/5"
          >
            <Home size={16} />
            Back Home
          </Link>
        </div>
      </div>
    </main>
  );
}
