"use client";

import { useEffect, useState } from "react";
import { Mail, MapPin, Navigation, Radio, ArrowUpRight } from "lucide-react";
import { getNextService, isLiveNow } from "../../utils/ServiceUtils";
import { useDirections } from "../../utils/UseDirection";
import DirectionsModal from "./DirectionModal";
import { CHURCH, SERVICES } from "@/config/config";

function fmtTime(h: number, m: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function nextServiceTimeLabel(day: "sunday" | "wednesday"): string {
  const s = day === "sunday" ? SERVICES.sunday : SERVICES.wednesday;
  return fmtTime(s.startH, s.startM);
}

/**
 * Footer-slab "Find Us" — "Hills Live" pattern.
 *
 * What makes this different from a standard contact card: it shows the church's
 * REAL-TIME service status — live now / counting down to the next service — instead
 * of a static "Open directions" CTA. Time-aware copy gives users a reason to act NOW
 * rather than "someday".
 *
 * Visual: split — left side has the live status pulse + headline; right side is a
 * compact bento with address + next-service tile + the directions CTA.
 *
 * Voice: tied to EHC's "everlasting hills" identity (Genesis 49:26) instead of
 * generic church-contact copy.
 */
export default function DirectionsSection() {
  const directions = useDirections();
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(tick);
  }, []);

  const live = isLiveNow(now);
  const next = getNextService(now);

  return (
    <section
      id="directions"
      aria-labelledby="directions-heading"
      className="max-w-[1400px] mx-auto px-5 sm:px-8 mb-16"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/5 via-white/[0.03] to-white/[0.02] backdrop-blur-sm shadow-2xl">
        {/* Decorative burgundy glow + faint topographic hill silhouettes */}
        <div className="absolute -top-32 -right-16 w-96 h-96 bg-[#87102C]/15 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-[#e8768a]/8 blur-3xl rounded-full pointer-events-none" />
        <HillsSilhouette />

        <div className="relative grid lg:grid-cols-5 gap-8 lg:gap-12 p-8 sm:p-10 lg:p-12 items-center">
          {/* LEFT (3/5): live status + headline */}
          <div className="lg:col-span-3">
            {/* Live indicator pill */}
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] uppercase tracking-[0.3em] backdrop-blur-md ${
                live
                  ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/60"
              }`}
            >
              <Radio
                size={12}
                className={live ? "animate-pulse text-emerald-300" : "text-white/40"}
              />
              {live ? "Service is live now" : `Next: ${next.label}`}
            </div>

            <h2
              id="directions-heading"
              className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-[1.05]"
            >
              Worship with us on the{" "}
              <span className="bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#87102C] bg-clip-text text-transparent italic font-serif">
                everlasting hills
              </span>
              .
            </h2>

            <p className="mt-4 max-w-xl text-white/65 leading-relaxed">
              A family, not a crowd — and there&apos;s always a seat for you.
              We&apos;re in <span className="text-white/85 font-medium">Ibadan</span>,
              gathered weekly to seek the One whose blessings rise higher than any
              mountain.
            </p>

          </div>

          {/* RIGHT (2/5): address + next-service + email + map */}
          <div className="lg:col-span-2 space-y-3">
            <AddressTile address={CHURCH.address} />
            <NextServiceTile next={next} live={live} />
            <EmailTile />
            <MapTile />
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={directions.handleGetDirections}
                className="group inline-flex items-center gap-2.5 rounded-2xl bg-white text-[#87102C] px-5 py-3 font-bold text-sm hover:bg-amber-50 hover:-translate-y-0.5 transition-all shadow-lg shadow-black/20"
              >
                <Navigation size={15} />
                Open directions
                <ArrowUpRight
                  size={14}
                  className="opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </button>
              <a
                href="/contact"
                className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white font-medium transition-colors"
              >
                Full contact info
                <ArrowUpRight size={13} />
              </a>
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

// ── Pieces ───────────────────────────────────────────────────────────────────

function AddressTile({ address }: { address: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0407]/70 p-5 backdrop-blur-sm hover:border-white/20 transition-colors">
      <div className="flex items-start gap-3.5">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#87102C]/25 text-[#e8768a] flex items-center justify-center">
          <MapPin size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1.5">
            The hills are here
          </p>
          <p className="text-sm text-white/90 leading-snug font-medium">{address}</p>
        </div>
      </div>
    </div>
  );
}

function NextServiceTile({
  next,
  live,
}: {
  next: ReturnType<typeof getNextService>;
  live: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0407]/70 p-5 backdrop-blur-sm">
      {/* Subtle gradient accent strip on the left edge */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#e8768a] via-[#87102C] to-transparent" />

      <div className="flex items-start gap-3.5 pl-2">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#87102C]/25 text-[#e8768a] flex items-center justify-center">
          <Radio size={16} className={live ? "animate-pulse" : ""} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1.5">
            {live ? "Happening now" : "Next gathering"}
          </p>
          <p className="text-sm text-white/90 leading-snug font-bold">{next.label}</p>
          <p className="text-xs text-white/55 mt-1">{nextServiceTimeLabel(next.day)}</p>
        </div>
      </div>
    </div>
  );
}

function EmailTile() {
  return (
    <a
      href="mailto:hello@everlastinghills.org"
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0e0407]/70 p-5 backdrop-blur-sm hover:border-white/20 transition-colors flex items-start gap-3.5"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#87102C]/25 text-[#e8768a] flex items-center justify-center">
        <Mail size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1.5">
          Email us
        </p>
        <p className="text-sm text-white/90 leading-snug font-medium truncate">
          hello@everlastinghills.org
        </p>
      </div>
    </a>
  );
}


function MapTile() {
  const embedUrl = `https://www.google.com/maps?q=${CHURCH.lat},${CHURCH.lng}&z=15&output=embed`;
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 h-44">
      <iframe
        src={embedUrl}
        className="w-full h-full grayscale-[0.5] contrast-110"
        loading="lazy"
        title="Church location map"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#87102C]/20 via-transparent to-black/30 pointer-events-none" />
    </div>
  );
}

/**
 * Faint topographic hill silhouette drawn in SVG and absolutely-positioned at the bottom.
 * Reinforces the "everlasting hills" identity without being literal.
 */
function HillsSilhouette() {
  return (
    <svg
      className="absolute bottom-0 left-0 right-0 w-full h-32 pointer-events-none opacity-[0.07]"
      viewBox="0 0 1400 200"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M0 200 L0 130 L180 90 L350 110 L520 70 L700 95 L880 60 L1050 90 L1220 75 L1400 110 L1400 200 Z"
        fill="white"
      />
      <path
        d="M0 200 L0 160 L220 120 L420 150 L620 110 L820 135 L1020 105 L1210 130 L1400 115 L1400 200 Z"
        fill="white"
        opacity="0.6"
      />
    </svg>
  );
}
