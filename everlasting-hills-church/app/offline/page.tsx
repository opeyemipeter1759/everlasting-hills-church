import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline — Everlasting Hills Church",
  description: "You are offline. Some parts of the app are still available.",
};

/**
 * Offline fallback. The service worker serves this for any navigation request
 * that fails while the device has no connection, in place of the browser's
 * default error page.
 *
 * Deliberately a server component with no data fetching and no client JS: it has
 * to render from the precache with no network at all, so anything that needs a
 * request would defeat the purpose.
 */
export default function OfflinePage() {
  const available = [
    "Pages you have already opened in this session",
    "Sermons you downloaded for offline listening",
    "Your saved notes and bookmarks",
  ];

  const needsConnection = [
    "Checking in to a service",
    "New sermons, courses and announcements",
    "Giving, forms and prayer requests",
  ];

  return (
    <main className="relative min-h-screen bg-church-dark text-white">
      {/* Same grain + burgundy wash used across the member area, so the offline
          state reads as part of the app rather than a browser error screen. */}
      <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.08]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(135,16,44,0.28),transparent_65%)]"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-white/70"
            aria-hidden
          >
            <path d="M2 8.82a15 15 0 0 1 20 0" opacity="0.35" />
            <path d="M5 12.86a10 10 0 0 1 14 0" opacity="0.6" />
            <path d="M8.5 16.43a5 5 0 0 1 7 0" />
            <path d="M12 20h.01" />
            <path d="m2 2 20 20" />
          </svg>
        </div>

        <h1 className="font-serif text-3xl leading-tight text-white sm:text-4xl">
          You are offline
        </h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
          There is no connection right now. The app is still here, and it will pick up where you
          left off as soon as you are back online.
        </p>

        <div className="mt-10 grid w-full gap-4 text-left sm:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
              Available offline
            </h2>
            <ul className="space-y-2.5">
              {available.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13.5px] leading-snug text-white/75">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-burgundy-light" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
              Needs a connection
            </h2>
            <ul className="space-y-2.5">
              {needsConnection.map((item) => (
                <li key={item} className="flex gap-2.5 text-[13.5px] leading-snug text-white/50">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-white/25" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <Link
          href="/dashboard"
          className="mt-10 inline-flex items-center justify-center rounded-full bg-burgundy px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-burgundy-light focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy-light focus-visible:ring-offset-2 focus-visible:ring-offset-church-dark"
        >
          Try again
        </Link>

        <p className="mt-6 text-xs text-white/35">
          Everlasting Hills Church, Ibadan
        </p>
      </div>
    </main>
  );
}
