"use client";

import Loader from "@/components/ui/feedback/Loader";

export function errorText(err: unknown, fallback = "Something went wrong. Try again."): string {
  return (err as { message?: string } | null)?.message || fallback;
}

export function PWLoading() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <Loader />
    </div>
  );
}

export function PWError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-[20px] border border-[var(--color-paper-line)] bg-white p-6 text-center">
      <p className="text-[var(--color-ink)]">{errorText(error)}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="pw-btn pw-btn-outline mt-4">
          Try again
        </button>
      )}
    </div>
  );
}
