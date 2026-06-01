"use client";

import { useEffect, useMemo, useState } from "react";
import ServiceHero from "./ServiceHero";
import ServiceCards from "./ServiceCard";
import { SERVICE_FALLBACK, type ServiceContent, type ServiceSlot } from "@/lib/site-settings";

/**
 * Service schedule section.
 *
 * Reads its schedule from site_settings (with a hardcoded fallback). The
 * "next service", "live now", and "today" computations are derived from that
 * schedule instead of the old SERVICES constant in config.ts.
 */
const DAY_INDEX: Record<ServiceSlot["day"], number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const DAY_LABEL: Record<ServiceSlot["day"], string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/** "07:30" → "7:30 AM" — used in the live ServiceCards copy. */
function formatTime(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  const period = h >= 12 ? "PM" : "AM";
  const display = ((h + 11) % 12) + 1;
  return m === 0 ? `${display}:00 ${period}` : `${display}:${mStr} ${period}`;
}

interface ResolvedSchedule {
  /** The next service slot relative to `now` (today's if still upcoming, otherwise the nearest future). */
  next: { slot: ServiceSlot; dayLabel: string };
  /** Is any service currently in its live window (liveStartTime ≤ now < endTime, today)? */
  isLive: boolean;
  /** Which configured slot, if any, has its day === today (and isn't fully past). */
  todaySlot: ServiceSlot | null;
}

function computeSchedule(services: ServiceSlot[], now: Date): ResolvedSchedule {
  const dow = now.getDay();
  const minsNow = now.getHours() * 60 + now.getMinutes();

  // Today's slot (if today is one of the configured days and the service hasn't ended)
  let todaySlot: ServiceSlot | null = null;
  let isLive = false;
  for (const s of services) {
    if (DAY_INDEX[s.day] === dow && parseTime(s.endTime) > minsNow) {
      todaySlot = s;
      const liveStart = parseTime(s.liveStartTime);
      const liveEnd = parseTime(s.endTime);
      if (minsNow >= liveStart && minsNow <= liveEnd) {
        isLive = true;
      }
      break;
    }
  }

  // Nearest upcoming slot (by day distance + time)
  let best: { slot: ServiceSlot; daysUntil: number } | null = null;
  for (const s of services) {
    const targetDow = DAY_INDEX[s.day];
    let daysUntil = (targetDow - dow + 7) % 7;
    if (daysUntil === 0 && parseTime(s.endTime) <= minsNow) {
      daysUntil = 7;
    }
    if (best === null || daysUntil < best.daysUntil) {
      best = { slot: s, daysUntil };
    }
  }
  const nextSlot = best?.slot ?? services[0];

  return {
    next: { slot: nextSlot, dayLabel: DAY_LABEL[nextSlot.day] },
    isLive,
    todaySlot,
  };
}

export default function ServiceSection({ content }: { content?: ServiceContent }) {
  const c = content ?? SERVICE_FALLBACK;
  const [now, setNow] = useState<Date>(new Date());

  // Tick every minute so day/live state stays fresh.
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const schedule = useMemo(() => computeSchedule(c.services, now), [c.services, now]);
  const headingText = `Join us this ${schedule.next.dayLabel}`;

  function scrollToDirections() {
    const el = document.getElementById("directions");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="services" className="py-24 md:py-32 bg-[#FFF4F6]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        {c.specialAnnouncement && (
          <div
            role="status"
            className="mb-10 flex items-start gap-3 rounded-2xl border border-[#E7CDD3] bg-white px-5 py-4 shadow-sm"
          >
            <span
              aria-hidden="true"
              className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FFE8ED] text-[#87102C]"
            >
              ✦
            </span>
            <p className="text-sm font-medium text-[#3a2d30]">
              {c.specialAnnouncement}
            </p>
          </div>
        )}
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <ServiceHero
            headingText={headingText}
            isLive={schedule.isLive}
            onGetDirections={scrollToDirections}
          />
          <ServiceCards
            services={c.services}
            todaySlotLabel={schedule.todaySlot?.label ?? null}
            isLive={schedule.isLive}
            locationName={c.locationName}
            address={c.address}
            formatTime={formatTime}
          />
        </div>
      </div>
    </section>
  );
}
