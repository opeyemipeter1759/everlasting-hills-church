"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutDashboard, ListChecks } from "lucide-react";
import PrayerWatchOverview from "../PrayerWatchOverview";
import PrayerWatchDashboard from "./PrayerWatchDashboard";

type Tab = "overview" | "manage";

/** The admin Prayer Watch page: an overview first, the day-to-day management one tab away. */
export default function PrayerWatchAdminTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "manage" ? "manage" : "overview";

  function go(next: Tab) {
    router.replace(next === "manage" ? `${pathname}?tab=manage` : pathname, { scroll: false });
    window.scrollTo({ top: 0 });
  }

  const tabs: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "manage", label: "Manage", icon: ListChecks },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="px-5 print:hidden">
        <div className="flex gap-1 border-b border-gray-200 dark:border-white/10" role="tablist" aria-label="Prayer Watch">
          {tabs.map((t) => {
            const Icon = t.icon;
            const on = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => go(t.key)}
                className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                  on ? "border-[#87102C] text-[#87102C] dark:border-[#E8768A] dark:text-[#E8768A]" : "border-transparent text-gray-500 hover:text-[#1A1210] dark:text-white/55 dark:hover:text-white"
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "manage" ? (
        <PrayerWatchOverview />
      ) : (
        <div className="flex flex-col gap-5 px-5" role="tabpanel">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-[#1A1210] dark:text-white">Prayer Watch</h1>
            <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-white/55">How the watch is doing tonight and over the last few months.</p>
          </header>
          <PrayerWatchDashboard onManage={() => go("manage")} />
        </div>
      )}
    </div>
  );
}
