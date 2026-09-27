"use client";

import { ChevronRight, GraduationCap } from "lucide-react";
import type { ContactRow } from "@/lib/api/evangelism";
import { Initials, SavedBadge, StatusBadge, WindowProgress, cardClass } from "./bits";
import { displayPhone } from "./labels";

function since(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/**
 * Contacts as a table from `md` up, as a list of tappable rows on a phone.
 * `bare` drops the outer card, for lists that already sit inside a Panel.
 */
export function ContactList({
  rows,
  onOpen,
  showOutreach = true,
  bare = false,
  layout = "auto",
}: {
  rows: ContactRow[];
  onOpen: (id: string) => void;
  showOutreach?: boolean;
  bare?: boolean;
  /** "list" keeps the phone list at every width — for narrow places like a drawer. */
  layout?: "auto" | "list";
}) {
  const listOnly = layout === "list";
  return (
    <>
      <ul className={`divide-y divide-gray-100 dark:divide-white/[0.06] ${listOnly ? "" : "md:hidden"} ${bare ? "" : `${cardClass} overflow-hidden`}`}>
        {rows.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onOpen(c.id)}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors active:bg-gray-50 dark:active:bg-white/[0.04]"
            >
              <Initials name={c.name} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
                    <span className="truncate">{c.name}</span>
                    {c.isStudent && <GraduationCap size={14} className="shrink-0 text-gray-400" aria-label="Student" />}
                  </p>
                  <SavedBadge status={c.savedStatus} />
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-white/50">
                  {displayPhone(c.phone)} · {c.worker.name}
                </p>
                <div className="mt-2.5 flex items-center justify-between gap-3">
                  <StatusBadge status={c.status} />
                  <div className="w-28">
                    <WindowProgress window={c.window} reviewOutcome={c.reviewOutcome} />
                  </div>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className={`hidden overflow-x-auto ${listOnly ? "" : "md:block"} ${bare ? "" : `${cardClass}`}`}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-xs font-medium text-gray-500 dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-white/45">
              <th scope="col" className="py-3 pl-5 pr-3 font-medium">Person</th>
              <th scope="col" className="px-3 py-3 font-medium">Saved</th>
              <th scope="col" className="px-3 py-3 font-medium">Preached by</th>
              {showOutreach && <th scope="col" className="px-3 py-3 font-medium">Outreach</th>}
              <th scope="col" className="px-3 py-3 font-medium">Status</th>
              <th scope="col" className="w-44 px-3 py-3 font-medium">30-day follow-up</th>
              <th scope="col" className="w-10 py-3 pr-4" aria-label="Open" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {rows.map((c) => (
              <tr
                key={c.id}
                onClick={() => onOpen(c.id)}
                className="group cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-white/[0.03]"
              >
                <td className="py-3 pl-5 pr-3">
                  <div className="flex items-center gap-3">
                    <Initials name={c.name} size={34} />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(c.id);
                        }}
                        className="flex items-center gap-1.5 whitespace-nowrap text-left font-semibold text-gray-900 hover:text-[#87102C] focus-visible:outline-none focus-visible:underline dark:text-white dark:hover:text-[#FFB3C1]"
                      >
                        {c.name}
                        {c.isStudent && <GraduationCap size={14} className="text-gray-400" aria-label="Student" />}
                      </button>
                      <p className="whitespace-nowrap text-xs text-gray-500 dark:text-white/45">
                        {displayPhone(c.phone)} · {since(c.daysSinceContact)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <SavedBadge status={c.savedStatus} />
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-700 dark:text-white/75">{c.worker.name}</td>
                {showOutreach && (
                  <td className="max-w-[12rem] px-3 py-3">
                    <span className="block truncate text-gray-600 dark:text-white/60">{c.outreach?.name ?? "Personal"}</span>
                  </td>
                )}
                <td className="px-3 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-3 py-3">
                  <WindowProgress window={c.window} reviewOutcome={c.reviewOutcome} />
                </td>
                <td className="py-3 pr-4 text-right text-gray-300 transition-colors group-hover:text-gray-500">
                  <ChevronRight size={16} aria-hidden="true" className="ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
