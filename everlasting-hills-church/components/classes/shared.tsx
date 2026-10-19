"use client";

import Loader from "@/components/ui/feedback/Loader";

export function errorText(err: unknown, fallback = "Something went wrong. Try again."): string {
  return (err as { message?: string } | null)?.message || fallback;
}

export function ClassLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader />
    </div>
  );
}

export function ClassError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-[20px] border border-[var(--color-pink-border)] bg-white p-6 text-center dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-[var(--color-ink)] dark:text-white">{errorText(error)}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="cls-btn cls-btn-outline mt-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function ProgressBar({ pct, label }: { pct: number; label?: string }) {
  return (
    <div className="cls-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label ?? "Progress"}>
      <span style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    weekday: withTime ? "short" : undefined,
    day: "numeric",
    month: "short",
    year: withTime ? undefined : "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    timeZone: withTime ? "Africa/Lagos" : "UTC",
  });
}

/** The video id in a YouTube watch, share, shorts, live or embed link; null for anything else. */
export function youTubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    else if (u.hostname.endsWith("youtube.com")) {
      id = u.searchParams.get("v") ?? (u.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/)?.[2] ?? null);
    }
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
