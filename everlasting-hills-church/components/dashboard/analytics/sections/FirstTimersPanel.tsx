"use client";
import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { format } from "date-fns";
import { SectionCard } from "@/components/ui/cards/SectionCard";
import { EmptyState } from "@/components/ui/display/EmptyState";
import { SkeletonLines } from "@/components/ui/display/SkeletonBlock";
import { MemberAvatar } from "@/components/ui/display/MemberAvatar";
import { Pagination } from "@/components/ui/navigation/Pagination";
import { useAnalyticsFirstTimers, type AnalyticsFilter } from "@/lib/api/analytics";

const SVC_NAMES: Record<string, string> = { sunday: "Sunday Service", wednesday: "Wednesday", special: "Special Service" };
const PAGE_SIZE = 5;

function rangeLabel(f: AnalyticsFilter) {
  if (f.dateFrom && f.dateTo) return `${f.dateFrom} – ${f.dateTo}`;
  const map: Record<string, string> = { today: "Today", week: "This Week", month: "This Month", year: "This Year" };
  return map[f.period ?? "week"] ?? "This Week";
}

export function FirstTimersPanel({ filter }: { filter: AnalyticsFilter }) {
  const { data, isLoading } = useAnalyticsFirstTimers(filter);
  const count = data?.length ?? 0;

  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [filter]);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const paged = (data ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <SectionCard
      title="First Timers"
      iconEl={<UserPlus size={13} />}
      action={
        <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-[#87102C] text-white text-[10px] font-black">
          {isLoading ? "…" : count}
        </span>
      }
    >
      <p className="text-[10px] text-gray-400 mb-3">{rangeLabel(filter)}</p>
      {isLoading ? <SkeletonLines lines={3} /> : count === 0 ? (
        <EmptyState compact title="No first timers" description="None recorded for this period." />
      ) : (
        <>
          <div className="space-y-2">
            {paged.map((ft) => (
              <div key={ft.userId} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
                <MemberAvatar name={ft.name} photoUrl={ft.photoUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{ft.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {SVC_NAMES[ft.serviceKey] ?? ft.serviceKey} · {format(new Date(ft.firstAttendedAt), "dd MMM")}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {pageCount > 1 && (
            <div className="mt-3 flex flex-col items-center gap-1.5">
              <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
              <p className="text-[10px] text-gray-400">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, count)} of {count}
              </p>
            </div>
          )}
        </>
      )}
    </SectionCard>
  );
}
