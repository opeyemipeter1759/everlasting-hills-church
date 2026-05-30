"use client";

import { useState, useEffect } from "react";
import { getNextService, isLiveNow, isServiceDay } from "../../utils/ServiceUtils";
import ServiceHero from "./ServiceHero";
import ServiceCards from "./ServiceCard";

/**
 * Service schedule section.
 *
 * Used to also embed "Get directions" — that's been split out into
 * DirectionsSection (which now lives in the global PageFooter slab so it appears
 * on every public + auth page, not just the homepage).
 *
 * ServiceHero still accepts onGetDirections as a prop; we pass an anchor scroll
 * to #directions so the hero CTA still works.
 */
export default function ServiceSection() {
  const [now, setNow] = useState<Date>(new Date());

  // Tick every minute so day/live state stays fresh
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const nextService = getNextService(now);
  const live = isLiveNow(now);
  const isSundayToday = isServiceDay(now, "sunday");
  const isWedToday = isServiceDay(now, "wednesday");
  const headingText = `Join us this ${nextService.label}`;

  function scrollToDirections() {
    const el = document.getElementById("directions");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section id="services" className="py-24 md:py-32 bg-[#FFF4F6]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <ServiceHero
            headingText={headingText}
            isLive={live}
            onGetDirections={scrollToDirections}
          />
          <ServiceCards
            isSundayToday={isSundayToday}
            isWednesdayToday={isWedToday}
            isLive={live}
          />
        </div>
      </div>
    </section>
  );
}
