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
  Saturday: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="1" y="2.5" width="12" height="10" rx="1.75" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 1v3M10 1v3M1 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4.6 9.2l1.1-2.2 1.1 2.2 2.4.3-1.8 1.6.5 2.3-2.2-1.2-2.2 1.2.5-2.3-1.8-1.6 2.4-.3z" fill="currentColor" opacity="0.9" />
    </svg>
  ),
  Shorts: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5.5 5l4 2-4 2V5z" fill="currentColor" />
    </svg>
  ),
  Monday: null,
  Tuesday: null,
  Wednesday: null,
  Thursday: null,
  Friday: null,
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
    <div className="inline-flex flex-wrap items-center gap-2 rounded-[28px] border border-white/10 bg-white/5 p-2 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      {tabs.map((tab) => {
        const isActive = active === tab;
        const count = tab === "All" ? counts.total : (counts[tab] ?? 0);

        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={[
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200",
              isActive
                ? "bg-gradient-to-r from-church-maroon to-[#5d091f] border-transparent text-white shadow-[0_12px_30px_rgba(135,16,44,0.35)]"
                : "bg-white/0 border-white/10 text-white/60 hover:border-white/20 hover:text-white/85 hover:bg-white/5",
            ].join(" ")}
          >
            <span className={isActive ? "text-white" : "text-[#FFB3C1]"}>
              {TAB_ICONS[tab] ?? null}
            </span>
            {tab}
            <span
              className={[
                "text-[11px] px-2 py-0.5 rounded-full font-bold tracking-wide",
                isActive ? "bg-white/15 text-white" : "bg-[#250B11] text-[#FFB3C1]/80",
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