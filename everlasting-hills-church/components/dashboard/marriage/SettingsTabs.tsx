"use client";

import { useState } from "react";
import { DocumentSettings } from "./letters/DocumentSettings";
import { LettersTab } from "./letters/LettersTab";
import PolicyClient from "./PolicyClient";

const TABS = [
  { key: "policy", label: "Policy" },
  { key: "letters", label: "Letters" },
  { key: "documents", label: "Documents settings" },
] as const;
type Tab = (typeof TABS)[number]["key"];

/** Marriage > Policy: the policy values, the two letters' wording, and the documents settings. */
export default function SettingsTabs() {
  const [tab, setTab] = useState<Tab>("policy");
  return (
    <div>
      <div role="tablist" aria-label="Policy sections" className="mx-auto flex max-w-3xl gap-1 overflow-x-auto px-4 pt-6 sm:px-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`min-h-10 whitespace-nowrap rounded-xl px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#87102C] ${
              tab === t.key ? "bg-[#87102C] text-white" : "text-gray-700 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "policy" && <PolicyClient />}
        {tab === "letters" && <LettersTab />}
        {tab === "documents" && <DocumentSettings />}
      </div>
    </div>
  );
}
