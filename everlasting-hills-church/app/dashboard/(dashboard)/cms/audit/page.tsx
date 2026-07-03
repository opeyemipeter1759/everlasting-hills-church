"use client";

import { useCmsAudit, type AuditEntry } from "@/lib/api/cms";

const ACTION_BADGE: Record<string, string> = {
  CREATE: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  UPDATE: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  PUBLISH: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  UNPUBLISH: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-white/50",
  DELETE: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  ROLLBACK: "bg-[#FFE8ED] text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#e8768a]",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function CmsAuditLog() {
  const { data: entries, isLoading, error } = useCmsAudit();

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
        {(error as { message?: string }).message ?? "Failed to load audit log"}
      </div>
    );
  }

  if (isLoading || !entries) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 p-12 text-center">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No activity yet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Every publish, edit, and delete will appear here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.06] overflow-hidden">
      {entries.map((e: AuditEntry) => (
        <div key={e.id} className="flex items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${ACTION_BADGE[e.action] ?? ACTION_BADGE.UPDATE}`}>
              {e.action}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {e.entity}
                {e.entityId ? <span className="text-gray-400 dark:text-white/40 font-mono text-xs"> · {e.entityId.slice(0, 8)}</span> : null}
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-400 dark:text-white/40 whitespace-nowrap">{fmt(e.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}
