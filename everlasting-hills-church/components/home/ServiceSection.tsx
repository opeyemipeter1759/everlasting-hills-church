"use client";

import { useState, useEffect } from "react";
import { getNextService, isLiveNow, isServiceDay } from "../utils/ServiceUtils";
import { useDirections } from "../utils/UseDirection";
import ServiceHero from "./ServiceHero";
import ServiceCards from "./ServiceCard";
import DirectionsModal from "./DirectionModal";

export default function ServiceSection() {
  const [now, setNow] = useState<Date>(new Date());

  // Tick every minute so day/live state stays fresh
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const nextService    = getNextService(now);
  const live           = isLiveNow(now);
  const isSundayToday  = isServiceDay(now, "sunday");
  const isWedToday     = isServiceDay(now, "wednesday");
  const headingText    = `Join us this ${nextService.label}`;

  const directions = useDirections();

  return (
    <section id="services" className="py-24 md:py-32 bg-[#FFF4F6]">
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <ServiceHero
            headingText={headingText}
            isLive={live}
            onGetDirections={directions.handleGetDirections}
          />
          <ServiceCards
            isSundayToday={isSundayToday}
            isWednesdayToday={isWedToday}
            isLive={live}
          />
        </div>
      </div>

      {directions.showMap && (
        <DirectionsModal
          travelMode={directions.travelMode}
          userLocation={directions.userLocation}
          locationError={directions.locationError}
          routeInfo={directions.routeInfo}
          loadingRoute={directions.loadingRoute}
          onClose={() => directions.setShowMap(false)}
          onModeChange={directions.handleModeChange}
        />
      )}
    </section>
  );
}