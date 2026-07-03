"use client";

import { ExternalLink, Lock } from "lucide-react";
import { useCmsPages, type CmsPageRow } from "@/lib/api/cms";

function StatusBadge({ row }: { row: CmsPageRow }) {
  if (row.published) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Published
      </span>
    );
  }
  return (
    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
      Draft
    </span>
  );
}

export default function CmsPagesOverview() {
  const { data: pages, isLoading, error } = useCmsPages();

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
        {(error as { message?: string }).message ?? "Failed to load pages"}
      </div>
    );
  }

  if (isLoading || !pages) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  // Group by content domain, preserving registry order.
  const groups: { name: string; rows: CmsPageRow[] }[] = [];
  for (const p of pages) {
    let g = groups.find((x) => x.name === p.group);
    if (!g) {
      g = { name: p.group, rows: [] };
      groups.push(g);
    }
    g.rows.push(p);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-[#FFF4F6]/50 dark:bg-white/[0.03] px-4 py-3 text-sm text-[#8a2540] dark:text-[#e8a3b3]">
        Every editable region of the public site lives here. Select a page to edit its content
        (block editor arrives next), or manage media and review the audit log from the left.
      </div>

      {groups.map((group) => (
        <section key={group.name}>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 dark:text-white/40 mb-3">
            {group.name}
          </p>
          <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.06] overflow-hidden">
            {group.rows.map((row) => (
              <div key={row.key} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-[#FFF4F6]/40 dark:hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{row.title}</p>
                    {row.featureFlag && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/5 text-gray-400">
                        <Lock size={9} /> {row.featureFlag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-white/40 mt-0.5 font-mono">{row.route}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <StatusBadge row={row} />
                  {row.published && (
                    <a
                      href={row.route}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline"
                    >
                      View live <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
