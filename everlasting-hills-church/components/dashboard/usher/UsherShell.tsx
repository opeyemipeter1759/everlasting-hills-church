"use client";

import { ClipboardList } from "lucide-react";
import { usePendingHeadcounts } from "@/lib/api/headcount";
import UsherTabs from "./UsherTabs";

/**
 * Shared frame for the ushering screens: title, tabs, and the outstanding count.
 *
 * The backlog query lives here rather than in the backlog page so the badge is
 * present on every tab — an usher who lands on Record still sees that three
 * services are waiting, which is the whole reason the number exists.
 */
export default function UsherShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pending = usePendingHeadcounts();

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#87102C]/10 dark:bg-[#87102C]/15">
          <ClipboardList size={17} className="text-[#87102C] dark:text-[#e8768a]" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">{title}</h1>
          <p className="mt-0.5 max-w-lg text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
        </div>
      </div>

      <UsherTabs pendingCount={pending.data?.length} />

      {children}
    </div>
  );
}
