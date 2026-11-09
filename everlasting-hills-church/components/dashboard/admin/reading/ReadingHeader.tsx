import { Eraser, Loader2, RefreshCw, Share2 } from "lucide-react";
import type { ReadingMonitorPage } from "./useReadingMonitorPage";

/** Title, and the Share a plan / Clear gone quiet / Refresh buttons. */
export default function ReadingHeader({ m }: { m: ReadingMonitorPage }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">Bible reading</h1>
        <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-white/55">
          How the church is reading, so you know who to encourage. Members only ever see their own
          progress.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => m.setShareOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-3 text-sm font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-60"
        >
          <Share2 size={15} aria-hidden="true" />
          Share a plan
        </button>
        <button
          type="button"
          onClick={() => { m.setActionError(null); m.setConfirmingClear(true); }}
          disabled={!m.clearable?.plans || m.clearGoneQuiet.isPending}
          title={m.clearable?.plans ? undefined : "Nobody's plan has been quiet for over a week"}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400 disabled:hover:bg-transparent dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10 dark:disabled:border-white/10 dark:disabled:text-white/35"
        >
          <Eraser size={15} aria-hidden="true" />
          Clear gone quiet
        </button>
        <button
          type="button"
          onClick={() => m.refetch()}
          disabled={m.isFetching}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
        >
          {m.isFetching ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <RefreshCw size={15} aria-hidden="true" />}
          Refresh
        </button>
      </div>
    </header>
  );
}
