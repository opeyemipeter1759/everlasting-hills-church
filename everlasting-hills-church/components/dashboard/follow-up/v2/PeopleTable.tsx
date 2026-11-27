"use client";

import { Fragment, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { PipelineRow } from "@/lib/api/pipeline";
import { StatusChip } from "./StatusChip";
import { PersonAvatar, PhoneCell, heardText, stageText, visitsText } from "./PersonCells";
import { PeopleCards } from "./PeopleCards";

export interface PeopleTableProps {
  rows: PipelineRow[];
  loading?: boolean;
  /** The full profile for a person. */
  profileHref: (row: PipelineRow) => string;
  /** What a row shows when expanded, e.g. every form answer. */
  renderExpanded?: (row: PipelineRow) => ReactNode;
  /** Per-row actions: Came again, Send on WhatsApp, Request approval. */
  renderActions?: (row: PipelineRow) => ReactNode;
  empty?: ReactNode;
}

const TH = "px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-white/45";
const TD = "px-3 py-3 align-top text-sm text-gray-700 dark:text-white/75";

/**
 * The people in the first-timer pipeline: a table on a wide screen, cards on a
 * phone. Shared by the Overview month page, the follow-up lists and the
 * Integration page, so a person reads the same way everywhere.
 */
export function PeopleTable(props: PeopleTableProps) {
  const { rows, loading, profileHref, renderExpanded, renderActions, empty } = props;
  const [open, setOpen] = useState<string | null>(null);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.04]" aria-label="Loading people" />;
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 px-5 py-10 text-center text-sm text-gray-500 dark:border-white/15 dark:text-white/50">
        {empty ?? "Nobody matches these filters."}
      </div>
    );
  }

  return (
    <>
      <div className="md:hidden">
        <PeopleCards {...props} open={open} onToggle={(id) => setOpen(open === id ? null : id)} />
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03] md:block">
        <table className="w-full">
          <thead className="border-b border-gray-200 dark:border-white/10">
            <tr>
              <th className={TH}>Name</th>
              <th className={TH}>Status</th>
              <th className={TH}>Follow-up</th>
              <th className={TH}>Visits</th>
              <th className={TH}>Phone</th>
              <th className={TH}>Heard from</th>
              {(renderExpanded || renderActions) && <th className={TH}><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {rows.map((row) => (
              <Fragment key={row.visitorId}>
                <tr>
                  <td className={TD}>
                    <Link href={profileHref(row)} className="-mx-2 -my-1 inline-flex items-center gap-2.5 rounded-lg px-2 py-1 font-semibold text-[#111] transition-colors hover:bg-[#FFE8ED] hover:text-[#87102C] focus-visible:bg-[#FFE8ED] focus-visible:outline-none dark:text-white dark:hover:bg-white/10 dark:hover:text-[#FFB3C1] dark:focus-visible:bg-white/10">
                      <PersonAvatar row={row} />
                      <span>
                        {row.firstName} {row.lastName}
                        {row.possibleReturn && <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">Possible return visit</span>}
                      </span>
                    </Link>
                  </td>
                  <td className={TD}><StatusChip status={row.status} /></td>
                  <td className={TD}>{stageText(row)}</td>
                  <td className={TD}><span className="tabular-nums">{row.visits}</span><span className="block text-xs text-gray-500 dark:text-white/45">{visitsText(row)}</span></td>
                  <td className={TD}><PhoneCell phone={row.phone} /></td>
                  <td className={TD}>{heardText(row)}</td>
                  {(renderExpanded || renderActions) && (
                    <td className={`${TD} whitespace-nowrap text-right`}>
                      <span className="inline-flex items-center gap-1.5">
                        {renderActions?.(row)}
                        {renderExpanded && (
                          <button
                            type="button"
                            onClick={() => setOpen(open === row.visitorId ? null : row.visitorId)}
                            aria-expanded={open === row.visitorId}
                            aria-label={`${open === row.visitorId ? "Hide" : "Show"} ${row.firstName}'s answers`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-white/50 dark:hover:bg-white/10"
                          >
                            <ChevronDown size={16} className={open === row.visitorId ? "rotate-180" : ""} aria-hidden="true" />
                          </button>
                        )}
                      </span>
                    </td>
                  )}
                </tr>
                {open === row.visitorId && renderExpanded && (
                  <tr>
                    <td colSpan={7} className="bg-gray-50/70 px-4 py-4 dark:bg-white/[0.02]">{renderExpanded(row)}</td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
