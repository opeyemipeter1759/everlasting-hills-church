"use client";

import type { ReactNode } from "react";
import type { VideoCategory,CategoryCounts } from "@/types";

type TabLabel = "All" | VideoCategory;

interface VideoFilterTabsProps {
  categories: VideoCategory[];
  counts: CategoryCounts;
  active: TabLabel;
  onChange: (tab: TabLabel) => void;
}

const TAB_ICONS: Record<TabLabel, ReactNode> = {
  All: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" />
      <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" />
    </svg>
  ),
  Sunday: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1l1.5 3.1L12 4.6l-2.5 2.4.6 3.4L7 8.8 3.9 10.4l.6-3.4L2 4.6l3.5-.5L7 1z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  ),
  Tuesday: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 1v3M10 1v3M1 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Shorts: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 5l4 2-4 2V5z" fill="currentColor" />
    </svg>
  ),
  Other: null,
};

export default function VideoFilterTabs({
  categories,
  counts,
  active,
  onChange,
}: VideoFilterTabsProps) {
  const tabs: TabLabel[] = ["All", ...categories];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {tabs.map((tab) => {
        const isActive = active === tab;
        const count = tab === "All" ? counts.total : (counts[tab] ?? 0);

        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200",
              isActive
                ? "bg-[#1A90FF] border-[#1A90FF] text-white"
                : "bg-transparent border-[#2A2F3A] text-[#8A9BB0] hover:border-[#3A4550] hover:text-[#B0BEC8]",
            ].join(" ")}
          >
            <span className={isActive ? "text-white" : "text-[#8A9BB0]"}>
              {TAB_ICONS[tab] ?? null}
            </span>
            {tab}
            <span
              className={[
                "text-xs px-1.5 py-0.5 rounded-full font-semibold",
                isActive ? "bg-white/20 text-white" : "bg-[#1E2530] text-[#6A7A8F]",
              ].join(" ")}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}