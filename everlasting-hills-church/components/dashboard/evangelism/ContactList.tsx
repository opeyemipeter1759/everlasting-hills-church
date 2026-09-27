"use client";

import { ChevronRight, GraduationCap, Phone } from "lucide-react";
import { Avatar } from "@/components/dashboard/admin/departments/HeadPicker";
import type { ContactRow } from "@/lib/api/evangelism";
import { FlagBadge, SavedBadge, StatusBadge, WindowProgress } from "./bits";
import { displayPhone } from "./labels";

function since(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

/** Contacts as a table from `md` up, as tappable cards on a phone. */
export function ContactList({ rows, onOpen, showOutreach = true }: { rows: ContactRow[]; onOpen: (id: string) => void; showOutreach?: boolean }) {
  return (
    <>
      <ul className="space-y-2.5 md:hidden">
        {rows.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onOpen(c.id)}
              className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-[#87102C]/30 dark:border-white/10 dark:bg-[#161618]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{c.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-white/50">
                    <Phone size={11} aria-hidden="true" /> {displayPhone(c.phone)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <SavedBadge status={c.savedStatus} />
                  {c.window.flag && <FlagBadge flag={c.window.flag} />}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <StatusBadge status={c.status} />
                {c.isStudent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600 dark:bg-white/10 dark:text-white/60">
                    <GraduationCap size={11} aria-hidden="true" /> Student
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <p className="min-w-0 truncate text-[11px] text-gray-400 dark:text-white/40">
                  {c.worker.name}
                  {showOutreach ? ` · ${c.outreach?.name ?? "Personal"}` : ""} · {since(c.daysSinceContact)}
                </p>
                <WindowProgress window={c.window} reviewOutcome={c.reviewOutcome} compact />
              </div>
            </button>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#161618] md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:border-white/10 dark:text-white/40">
              <th className="px-4 py-3">Name</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Saved</th>
              <th className="px-3 py-3">Worker</th>
              {showOutreach && <th className="px-3 py-3">Outreach</th>}
              <th className="px-3 py-3">Since</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Follow-up</th>
              <th className="w-8 px-2 py-3" aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                onClick={() => onOpen(c.id)}
                className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/80 dark:border-white/[0.04] dark:hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onOpen(c.id)} className="text-left font-semibold text-gray-900 hover:text-[#87102C] dark:text-white">
                    {c.name}
                  </button>
                  {c.isStudent && <p className="text-[11px] text-gray-400">{[c.school, c.level].filter(Boolean).join(" · ") || "Student"}</p>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-gray-600 dark:text-white/70">{displayPhone(c.phone)}</td>
                <td className="px-3 py-3">
                  <SavedBadge status={c.savedStatus} />
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-white/70">
                    <Avatar name={c.worker.name} photoUrl={c.worker.photoUrl} px={22} />
                    <span className="max-w-[9rem] truncate">{c.worker.name}</span>
                  </span>
                </td>
                {showOutreach && (
                  <td className="max-w-[10rem] truncate px-3 py-3 text-gray-600 dark:text-white/60">{c.outreach?.name ?? "Personal"}</td>
                )}
                <td className="whitespace-nowrap px-3 py-3 text-gray-500 dark:text-white/50">{since(c.daysSinceContact)}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex min-w-[8rem] flex-col gap-1">
                    {c.window.flag && <FlagBadge flag={c.window.flag} />}
                    <WindowProgress window={c.window} reviewOutcome={c.reviewOutcome} />
                  </div>
                </td>
                <td className="px-2 py-3 text-gray-300">
                  <ChevronRight size={16} aria-hidden="true" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
