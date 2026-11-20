"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { ApiError } from "@/lib/api/axios";
import { COUPLE_KEY, useCoupleOverview } from "@/lib/api/couple";
import { DocumentsPanel } from "./DocumentsPanel";
import { MaterialsPanel } from "./MaterialsPanel";
import { ProgressPanel } from "./ProgressPanel";
import { SessionsPanel } from "./SessionsPanel";
import { muted, panel, plainDate, roleWord } from "./parts";

/**
 * The couple dashboard: the same for both partners, whether they signed in
 * with the account made for the dashboard or with their member account.
 */
export default function CoupleDashboard() {
  const q = useCoupleOverview();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: COUPLE_KEY });

  if (q.isLoading)
    return (
      <p role="status" className={muted}>
        Opening your dashboard…
      </p>
    );
  if (q.isError || !q.data) {
    const missing = (q.error as ApiError | null)?.status === 404;
    return (
      <div role="alert" className={panel}>
        <p className="font-semibold text-[#111] dark:text-white">{missing ? "We could not find an application for this account" : "Your dashboard did not open"}</p>
        <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
          {missing
            ? "If you have only just applied, please give it a few minutes. Otherwise, call the church office and we will sort it out."
            : "Please check your connection and try again."}
        </p>
        {!missing && (
          <button type="button" onClick={() => q.refetch()} className="mt-3 text-sm font-semibold text-[#87102C] underline dark:text-[#FFB3C1]">
            Try again
          </button>
        )}
      </div>
    );
  }

  const d = q.data;
  const a = d.application;
  const you = roleWord(a.you.role);
  return (
    <div className="space-y-6">
      <header>
        <p className={`text-sm ${muted}`}>Pre-marital counselling{you ? `, as the ${you}` : ""}</p>
        <h1 className="mt-1 font-serif text-3xl font-bold leading-tight text-[#111] dark:text-white sm:text-4xl">
          {a.you.firstName} and {a.partner.firstName}
        </h1>
        <p className={`mt-2 text-sm ${muted}`}>
          Application <span className="font-semibold text-[#111] dark:text-white">{a.reference}</span>
          {a.weddingDate && (
            <>
              {", wedding planned for "}
              <span className="font-semibold text-[#111] dark:text-white">{plainDate(a.weddingDate)}</span>
            </>
          )}
        </p>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <ProgressPanel data={d} />
          <SessionsPanel sessions={d.sessions} />
        </div>
        <div className="space-y-6">
          <DocumentsPanel data={d} onChanged={refresh} />
          <MaterialsPanel materials={d.materials} />
        </div>
      </div>
    </div>
  );
}
