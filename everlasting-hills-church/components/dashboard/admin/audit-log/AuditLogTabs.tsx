"use client";

import { useState } from "react";
import AuditLogClient from "./AuditLogClient";
import { ActivityTrail } from "./activity/ActivityTrail";

const VIEWS = [
  { key: "activity", label: "Audit trail" },
  { key: "reports", label: "Status reports" },
] as const;

type View = (typeof VIEWS)[number]["key"];

/** The Audit Log page: the trail of everything people did, and the status reports to review. */
export default function AuditLogTabs() {
  const [view, setView] = useState<View>("activity");
  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Audit Log" className="inline-flex rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-[#161618]">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={view === v.key}
            onClick={() => setView(v.key)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              view === v.key ? "bg-[#87102C] text-white" : "text-gray-600 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
      {view === "activity" ? <ActivityTrail /> : <AuditLogClient />}
    </div>
  );
}
