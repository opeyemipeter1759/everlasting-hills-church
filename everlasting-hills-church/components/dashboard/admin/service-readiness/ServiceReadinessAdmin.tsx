"use client";

import { useState } from "react";
import ReadinessBoard from "./ReadinessBoard";
import InspectionPanel from "./InspectionPanel";
import ServiceReadinessSetup from "./ServiceReadinessSetup";

type Tab = "board" | "inspection" | "setup";
const TABS: { value: Tab; label: string }[] = [
  { value: "board", label: "Board" },
  { value: "inspection", label: "Inspection" },
  { value: "setup", label: "Setup" },
];

/** The Church Administrator's page: the readiness board for the coming service, and the setup behind it. */
export default function ServiceReadinessAdmin() {
  const [tab, setTab] = useState<Tab>("board");
  return (
    <div className="space-y-6 px-5">
      <header>
        <h1 className="text-2xl font-black tracking-tight text-[#111] dark:text-white">Service readiness</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-white/55">
          Each unit lists its tasks for every service and sends the plan 24 hours ahead. Approve plans, add tasks, and inspect units the day before and 2 hours before.
        </p>
      </header>
      <div role="tablist" aria-label="Service readiness" className="flex gap-1 border-b border-gray-200 dark:border-white/10">
        {TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold ${tab === value ? "border-[#87102C] text-[#87102C] dark:border-[#FFB3C1] dark:text-[#FFB3C1]" : "border-transparent text-gray-500 dark:text-white/50"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "board" ? <ReadinessBoard /> : tab === "inspection" ? <InspectionPanel /> : <ServiceReadinessSetup />}
    </div>
  );
}
