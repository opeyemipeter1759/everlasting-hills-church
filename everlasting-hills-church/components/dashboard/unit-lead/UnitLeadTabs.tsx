"use client";

import Link from "next/link";

const TABS = [
  { key: "members", label: "Members", path: "" },
  { key: "roles", label: "Roles", path: "/roles" },
  { key: "tasks", label: "Tasks", path: "/tasks" },
  { key: "expenses", label: "Expenses", path: "/expenses" },
] as const;

export default function UnitLeadTabs({
  unitId,
  active,
}: {
  unitId: string;
  active: (typeof TABS)[number]["key"];
}) {
  return (
    <div className="flex items-center gap-1 border-b border-gray-200 dark:border-white/10">
      {TABS.map((tab) => (
        <Link
          key={tab.key}
          href={`/dashboard/unit-lead/${unitId}${tab.path}`}
          className={`px-3.5 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            active === tab.key
              ? "border-[#87102C] text-[#87102C] dark:text-[#e8768a]"
              : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
