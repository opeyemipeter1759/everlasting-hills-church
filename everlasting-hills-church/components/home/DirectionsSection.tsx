"use client";

import { MapPin, Navigation, Car, FootprintsIcon, Bus } from "lucide-react";
import { useDirections } from "../../utils/UseDirection";
import DirectionsModal from "./DirectionModal";
import { CHURCH } from "@/config/config";

/**
 * Standalone "How to find us" section.
 *
 * Used in the global PageFooter slab so every public + auth page surfaces the
 * directions affordance consistently. Was previously bolted onto ServiceSection;
 * splitting it out lets ServiceSection focus purely on schedule + ServiceCards.
 */
export default function DirectionsSection() {
  const directions = useDirections();

  return (
    <section
      id="directions"
      aria-labelledby="directions-heading"
      className="max-w-[1400px] mx-auto px-5 sm:px-8 mb-16"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/7 backdrop-blur-sm shadow-lg px-6 py-8 sm:px-8 sm:py-10">
        <div className="grid gap-6 md:grid-cols-2 items-center">
          {/* Left: address + heading */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.35em] text-white/60 shadow-inner shadow-black/20">
              <MapPin size={12} />
              Find us
            </div>
            <div>
              <h2
                id="directions-heading"
                className="text-3xl sm:text-4xl font-semibold text-white tracking-tight leading-tight"
              >
                Come and worship with us
              </h2>
              <p className="mt-4 max-w-xl text-white/65 leading-relaxed">
                {CHURCH.address}. We&apos;d love to have you in service this week.
              </p>
            </div>
          </div>

          {/* Right: get directions CTA + transport modes */}
          <div className="rounded-[20px] border border-white/8 bg-[#12050a]/95 p-6 shadow-sm md:ml-4">
            <p className="text-white/50 text-xs uppercase tracking-[0.25em] font-semibold mb-5">
              Get directions
            </p>
            <button
              type="button"
              onClick={directions.handleGetDirections}
              className="inline-flex items-center gap-2.5 w-full justify-center rounded-2xl bg-white text-[#87102C] px-5 py-3.5 font-bold text-sm hover:bg-amber-50 hover:-translate-y-0.5 transition-all shadow-lg shadow-black/10"
            >
              <Navigation size={16} />
              Open directions
            </button>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-3 flex flex-col items-center gap-1.5">
                <Car size={16} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Drive
                </span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-3 flex flex-col items-center gap-1.5">
                <FootprintsIcon size={16} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Walk
                </span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 px-3 py-3 flex flex-col items-center gap-1.5">
                <Bus size={16} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                  Transit
                </span>
              </div>
            </div>
          </div>
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
