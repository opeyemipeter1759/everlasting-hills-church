"use client";

import { Clock, MapPin, Calendar, Youtube, type LucideIcon } from "lucide-react";
import ScrollReveal from "./ScrollReveal";
import { CHURCH } from "../../config/config";
import type { ServiceSlot } from "@/lib/site-settings";

interface ServiceCardsProps {
  services: ServiceSlot[];
  /** Label of the slot whose day matches today; null if today isn't a service day. */
  todaySlotLabel: string | null;
  isLive: boolean;
  locationName: string;
  address: string | null;
  formatTime: (hhmm: string) => string;
}

const DAY_PLURAL: Record<ServiceSlot["day"], string> = {
  sunday: "Sundays",
  monday: "Mondays",
  tuesday: "Tuesdays",
  wednesday: "Wednesdays",
  thursday: "Thursdays",
  friday: "Fridays",
  saturday: "Saturdays",
};

/**
 * Pick an icon based on position in the list. The first service gets the Clock
 * icon (it's typically the main/Sunday service), midweek gets Calendar.
 * Identity, not data — stays in code.
 */
function iconFor(index: number): LucideIcon {
  if (index === 0) return Clock;
  return Calendar;
}

export default function ServiceCards({
  services,
  todaySlotLabel,
  isLive,
  locationName,
  address,
  formatTime,
}: ServiceCardsProps) {
  const cards = services.map((s, i) => {
    const isActive = todaySlotLabel === s.label;
    return {
      icon: iconFor(i),
      label: s.label,
      value: `${DAY_PLURAL[s.day]} — ${formatTime(s.startTime)}`,
      sub: isActive
        ? "🟢 Service is on today"
        : s.description,
      isActive,
    };
  });

  // Location card sits at the end of the stack.
  const locationCard = {
    icon: MapPin,
    label: "Location",
    value: locationName,
    sub: address ?? "Address coming soon",
    isActive: false,
  };

  return (
    <div className="space-y-4">
      {[...cards, locationCard].map((card, i) => (
        <ScrollReveal key={`${card.label}-${i}`} delay={0.15 + i * 0.1} direction="right">
          <div
            className={`flex items-start gap-5 bg-white rounded-2xl p-6 border transition-all duration-300 ${
              card.isActive
                ? "border-[#87102C]/30 shadow-[0_4px_24px_rgba(135,16,44,0.10)]"
                : "border-[#E7CDD3]/60 hover:border-[#E7CDD3] hover:shadow-[0_4px_24px_rgba(135,16,44,0.06)]"
            }`}
          >
            <div
              className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                card.isActive ? "bg-[#87102C]" : "bg-[#FFE8ED]"
              }`}
            >
              <card.icon
                size={18}
                className={card.isActive ? "text-white" : "text-[#87102C]"}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#999] tracking-[0.15em] uppercase font-medium mb-0.5">
                {card.label}
              </p>
              <p className="text-[#111] font-semibold text-base">{card.value}</p>
              <p
                className={`text-sm mt-0.5 ${
                  card.isActive ? "text-[#87102C] font-medium" : "text-[#888]"
                }`}
              >
                {card.sub}
              </p>

              {card.isActive && isLive && (
                <a
                  href={CHURCH.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  Join Live on YouTube
                </a>
              )}

              {card.isActive && !isLive && (
                <a
                  href={CHURCH.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FFE8ED] text-[#87102C] text-xs font-semibold hover:bg-[#FFCDD7] transition-colors"
                >
                  <Youtube size={13} />
                  Watch on YouTube
                </a>
              )}
            </div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
