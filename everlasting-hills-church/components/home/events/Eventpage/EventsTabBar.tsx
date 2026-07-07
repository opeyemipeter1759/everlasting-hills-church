"use client";

import { motion } from "framer-motion";
import { CalendarClock, CalendarDays, Archive, type LucideIcon } from "lucide-react";

export type EventsTab = "ongoing" | "upcoming" | "past";

interface EventsTabBarProps {
  active: EventsTab;
  onChange: (tab: EventsTab) => void;
  ongoingCount: number;
  upcomingCount: number;
  pastCount: number;
}

const TAB_CONFIG: { key: EventsTab; label: string; icon: LucideIcon }[] = [
  { key: "ongoing", label: "Ongoing", icon: CalendarClock },
  { key: "upcoming", label: "Upcoming", icon: CalendarDays },
  { key: "past", label: "Past", icon: Archive },
];

export default function EventsTabBar({
  active,
  onChange,
  ongoingCount,
  upcomingCount,
  pastCount,
}: EventsTabBarProps) {
  const counts: Record<EventsTab, number> = {
    ongoing: ongoingCount,
    upcoming: upcomingCount,
    past: pastCount,
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[#E7CDD3] bg-white p-1.5 shadow-[0_8px_30px_-12px_rgba(135,16,44,0.25)]">
      {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        const count = counts[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors duration-200 ${
              isActive ? "text-white" : "text-[#666] hover:text-[#111]"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="events-tab-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#87102C] to-[#5d091f] shadow-md shadow-[#87102C]/30"
                transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              />
            )}
            <span className="relative flex items-center gap-2">
              {key === "ongoing" && count > 0 && (
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                      isActive ? "bg-white/60" : "bg-emerald-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-2 w-2 rounded-full ${
                      isActive ? "bg-white" : "bg-emerald-500"
                    }`}
                  />
                </span>
              )}
              <Icon size={14} className={isActive ? "text-white" : "text-[#87102C]/70"} />
              {label}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-[#FFF4F6] text-[#87102C]"
                }`}
              >
                {count}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
