"use client";

import { useReadingMonitorPage } from "./useReadingMonitorPage";
import ReadingHeader from "./ReadingHeader";
import ReadingNotices from "./ReadingNotices";
import ReadingTiles from "./ReadingTiles";
import ReaderFilters from "./ReaderFilters";
import ReaderRow from "./ReaderRow";
import ReadingDialogs from "./ReadingDialogs";

export default function ReadingMonitor() {
  const m = useReadingMonitorPage();
  const { data, rows } = m;

  return (
    <div className="space-y-6 px-5">
      <ReadingHeader m={m} />
      <ReadingNotices m={m} />
      {m.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : m.isError ? (
        <div role="alert" className="rounded-2xl border border-red-200 p-5 text-sm text-gray-700 dark:border-red-900 dark:text-white/75">
          Reading progress could not load.{" "}
          <button type="button" onClick={() => m.refetch()} className="min-h-11 font-semibold underline">
            Try again
          </button>
        </div>
      ) : (
        <>
          <ReadingTiles stats={data?.stats} finishedSomething={m.finishedSomething} filter={m.filter} onSelect={m.showGroup} />
          <ReaderFilters m={m} />

          <p role="status" className="text-xs text-gray-500 dark:text-white/50">
            Showing {rows.length} of {data?.readers.length ?? 0} active members
          </p>

          {rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
              Nobody matches this view.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 dark:divide-white/[0.06] dark:border-white/10">
              {rows.map((reader) => (
                <ReaderRow
                  key={reader.memberId}
                  reader={reader}
                  today={data!.today}
                  onRemovePlan={(plan) => { m.setActionError(null); m.setRemoving({ reader, plan }); }}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <ReadingDialogs m={m} />
    </div>
  );
}
