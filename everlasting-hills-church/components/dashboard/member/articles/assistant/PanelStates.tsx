import { AlertCircle, Loader2 } from "lucide-react";

/** While the model works: what it is doing, and placeholder lines. */
export function PanelLoading({ message, long }: { message: string; long: boolean }) {
  return (
    <div aria-live="polite" aria-busy="true">
      <p className="m-muted flex items-center gap-2 text-[13px]">
        <Loader2 size={15} className="animate-spin text-[var(--m-brand)]" aria-hidden="true" />
        {message}
      </p>
      <div className="mt-4 space-y-2.5">
        {[92, 100, 84, 96, 70].map((w) => (
          <div key={w} className="h-3 animate-pulse rounded-full bg-[var(--m-line)]" style={{ width: `${w}%` }} />
        ))}
      </div>
      {long && <p className="m-muted mt-4 text-[12px]">Long stories take a little longer. You can keep writing meanwhile.</p>}
    </div>
  );
}

export function PanelError({ message }: { message: string }) {
  return (
    <div role="alert" className="flex gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] p-3.5 text-[13px]">
      <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
      <div>
        <p className="m-ink font-semibold">The assistant could not finish</p>
        <p className="m-body mt-0.5">{message}</p>
      </div>
    </div>
  );
}
