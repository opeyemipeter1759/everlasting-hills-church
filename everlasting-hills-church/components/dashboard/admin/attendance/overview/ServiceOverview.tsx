"use client";

import Link from "next/link";
import { ArrowDown, ChevronLeft, ChevronRight, ClipboardList, FileText } from "lucide-react";
import type { ServiceOverviewResponse } from "@/lib/api/attendance-roll";
import HeadcountFigures from "./HeadcountFigures";
import RecentServicesStrip from "./RecentServicesStrip";
import { KIND_LABEL, KIND_PLURAL, defaultService, lagosToday, longDate, previousCounted, rollSize, sameKind, share } from "./overview-data";

const navBtn =
  "flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5";

/**
 * The top of the Attendance page: one service at a time, the latest by
 * default. The ushers' headcount gives the whole room (men, women, children);
 * the line under it is the members who checked in on the app.
 */
export default function ServiceOverview({ data, selectedId, onSelect }: { data: ServiceOverviewResponse; selectedId: string; onSelect: (id: string) => void }) {
  const { services, activeMembers } = data;
  const i = Math.max(0, services.findIndex((s) => s.id === selectedId));
  const s = services[i];
  const older = services[i + 1];
  const newer = services[i - 1];
  const prev = previousCounted(services, s.id);
  const kicker = s.date === lagosToday() ? "Today's service" : s.id === defaultService(services)?.id ? "Last service" : "Earlier service";
  const roll = rollSize(s, activeMembers);

  return (
    <section aria-labelledby="service-overview-title" className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#1c1c1e] sm:p-6">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[#87102C] dark:text-[#E8768A]">{kicker}</p>
          <h2 id="service-overview-title" className="mt-0.5 text-lg font-black tracking-tight text-[#1A1210] dark:text-white sm:text-xl">
            {KIND_LABEL[s.serviceType]}
          </h2>
          <p className="text-sm text-gray-500 dark:text-white/50">{longDate(s.date)}</p>
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button type="button" className={navBtn} disabled={!older} onClick={() => older && onSelect(older.id)} aria-label="Earlier service">
            <ChevronLeft size={16} />
          </button>
          <button type="button" className={navBtn} disabled={!newer} onClick={() => newer && onSelect(newer.id)} aria-label="Later service">
            <ChevronRight size={16} />
          </button>
        </div>
      </header>

      {s.headcount ? (
        <>
          <HeadcountFigures hc={s.headcount} prev={prev?.headcount ? { headcount: prev.headcount, date: prev.date } : undefined} />
          {s.headcount.status === "DRAFT" && (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">The ushers saved this count as a draft, so it may still change.</p>
          )}
        </>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-gray-300 px-4 py-5 dark:border-white/15">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/85">The ushers haven&apos;t counted this service yet.</p>
          <p className="mt-1 text-xs text-gray-500 dark:text-white/50">Once they record it, you&apos;ll see the men, women and children who came.</p>
          <Link href="/dashboard/usher" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#87102C] hover:underline dark:text-[#E8768A]">
            <ClipboardList size={13} /> Record the headcount
          </Link>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 text-sm dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-gray-600 dark:text-white/65">
          {s.headcount && (
            <span>
              <strong className="font-black tabular-nums text-[#1A1210] dark:text-white">{s.headcount.firstTimers}</strong>{" "}
              {s.headcount.firstTimers === 1 ? "first timer" : "first timers"}
            </span>
          )}
          <span>
            <strong className="font-black tabular-nums text-[#1A1210] dark:text-white">{s.checkedIn}</strong> of {roll} members checked in on the app ({share(s.checkedIn, roll)}%)
          </span>
        </div>
        <a href="#attendance-roll" className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-[#87102C] hover:underline dark:text-[#E8768A]">
          <ArrowDown size={13} /> See who checked in
        </a>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-white/60">{KIND_PLURAL[s.serviceType]}</p>
          <Link href="/dashboard/admin/attendance/ushers-report" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#87102C] dark:text-white/50 dark:hover:text-[#E8768A]">
            <FileText size={12} /> Ushers&apos; report
          </Link>
        </div>
        <RecentServicesStrip services={sameKind(services, s.serviceType)} selectedId={s.id} onSelect={onSelect} />
      </div>
    </section>
  );
}
