"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { PeopleTableProps } from "./PeopleTable";
import { StatusChip } from "./StatusChip";
import { PersonAvatar, PhoneCell, heardText, stageText, visitsText } from "./PersonCells";

/** The people table on a phone: one card per person, with the same facts and actions. */
export function PeopleCards({
  rows,
  profileHref,
  renderExpanded,
  renderActions,
  open,
  onToggle,
}: PeopleTableProps & { open: string | null; onToggle: (id: string) => void }) {
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.visitorId} className="rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-start gap-3">
            <PersonAvatar row={row} size={40} />
            <div className="min-w-0 flex-1">
              <Link href={profileHref(row)} className="block truncate font-semibold text-[#111] dark:text-white">
                {row.firstName} {row.lastName}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <StatusChip status={row.status} />
                {row.possibleReturn && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">Possible return visit</span>
                )}
              </div>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-1.5 text-sm text-gray-700 dark:text-white/75">
            <div className="flex gap-2"><dt className="w-20 flex-shrink-0 text-gray-500 dark:text-white/45">Follow-up</dt><dd className="min-w-0">{stageText(row)}</dd></div>
            <div className="flex gap-2"><dt className="w-20 flex-shrink-0 text-gray-500 dark:text-white/45">Visits</dt><dd className="min-w-0">{row.visits}: {visitsText(row)}</dd></div>
            <div className="flex gap-2"><dt className="w-20 flex-shrink-0 text-gray-500 dark:text-white/45">Phone</dt><dd className="min-w-0"><PhoneCell phone={row.phone} /></dd></div>
            <div className="flex gap-2"><dt className="w-20 flex-shrink-0 text-gray-500 dark:text-white/45">Heard</dt><dd className="min-w-0">{heardText(row)}</dd></div>
          </dl>
          {(renderActions || renderExpanded) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {renderActions?.(row)}
              {renderExpanded && (
                <button
                  type="button"
                  onClick={() => onToggle(row.visitorId)}
                  aria-expanded={open === row.visitorId}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-white/60 dark:hover:bg-white/10"
                >
                  {open === row.visitorId ? "Hide answers" : "All answers"}
                  <ChevronDown size={14} className={open === row.visitorId ? "rotate-180" : ""} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          {open === row.visitorId && renderExpanded && <div className="mt-3 border-t border-gray-100 pt-3 dark:border-white/[0.06]">{renderExpanded(row)}</div>}
        </li>
      ))}
    </ul>
  );
}
