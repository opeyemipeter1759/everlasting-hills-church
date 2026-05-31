"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Expand, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import ScrollReveal from "@/components/home/ScrollReveal";
import { HEAVEN_ON_EARTH } from "./event-constants";

/**
 * Flyer showcase — the page's centerpiece. Premium frame with glass reflection,
 * subtle glow, and click-to-enlarge modal.
 *
 * Graceful fallback: if the flyer image isn't present at /public/events/...,
 * a branded gradient block stands in so the page renders cleanly until the
 * real artwork is uploaded.
 *
 * Pattern: Centered Hero (light bg) with a single feature card. Hover lift on
 * the frame; spring-scale entrance for the modal.
 */
export default function FlyerShowcase() {
  const [zoomed, setZoomed] = useState(false);
  const [imageOk, setImageOk] = useState<boolean | null>(null);

  // Probe the flyer's existence client-side. We try to load it once; if it 404s
  // we render the placeholder instead.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setImageOk(true);
    img.onerror = () => setImageOk(false);
    img.src = HEAVEN_ON_EARTH.flyerImagePath;
  }, []);

  // Lock body scroll while modal open
  useEffect(() => {
    if (!zoomed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [zoomed]);

  // Close on Escape
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoomed]);

  return (
    <section className="py-24 md:py-32 bg-[#FFF4F6] relative overflow-hidden">
      {/* Soft branded glow corners */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#87102C]/8 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#FFB3C1]/15 blur-3xl rounded-full pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8">
        <ScrollReveal>
          <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3 text-center">
            The Invitation
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance text-center">
            Heaven Is{" "}
            <span className="text-[#87102C] font-serif italic">In Print</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed text-center max-w-2xl mx-auto">
            Tap the flyer to enlarge. Share it with someone who needs to be in
            the room.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="mt-14 flex justify-center">
            <button
              type="button"
              onClick={() => setZoomed(true)}
              aria-label="Enlarge event flyer"
              className="group relative w-full max-w-md focus:outline-none focus-visible:ring-4 focus-visible:ring-[#87102C]/30 rounded-2xl"
            >
              {/* Outer glow */}
              <div className="absolute -inset-4 bg-gradient-to-br from-[#87102C]/30 via-[#FFB3C1]/20 to-transparent rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Luxury frame */}
              <div className="relative rounded-2xl bg-gradient-to-br from-[#87102C] via-[#6E0C24] to-[#2a0410] p-1.5 shadow-2xl shadow-[#87102C]/30 group-hover:-translate-y-1 group-hover:shadow-[#87102C]/50 transition-all duration-500">
                <div className="relative rounded-[14px] overflow-hidden aspect-[3/4] bg-[#1a0610]">
                  {imageOk === true ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={HEAVEN_ON_EARTH.flyerImagePath}
                      alt={`${HEAVEN_ON_EARTH.title} event flyer`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FlyerPlaceholder loading={imageOk === null} />
                  )}

                  {/* Glass reflection sweep */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[heoSheen_1.5s_ease-in-out]" />
                  </div>

                  {/* Hover hint pill */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-white/95 text-[#87102C] px-3.5 py-1.5 text-xs font-bold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                    <Expand size={12} />
                    View full size
                  </div>
                </div>
              </div>
            </button>
          </div>
        </ScrollReveal>
      </div>

      {/* ── Zoom modal ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomed(false)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-5 cursor-zoom-out"
            role="dialog"
            aria-modal="true"
            aria-label="Flyer enlarged view"
          >
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Close enlarged view"
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
            >
              <X size={20} />
            </button>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-[min(90vw,560px)] max-h-[90vh] cursor-default"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-[#1a0610] aspect-[3/4]">
                {imageOk === true ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={HEAVEN_ON_EARTH.flyerImagePath}
                    alt={`${HEAVEN_ON_EARTH.title} event flyer enlarged`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FlyerPlaceholder />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes heoSheen {
          0% { transform: translateX(0%) skewX(-20deg); }
          100% { transform: translateX(400%) skewX(-20deg); }
        }
      `}</style>
    </section>
  );
}

// ── Placeholder for the missing flyer ──────────────────────────────────────

function FlyerPlaceholder({ loading = false }: { loading?: boolean }) {
  return (
    <div
      className="w-full h-full relative flex flex-col items-center justify-center text-center p-8"
      style={{
        background:
          "linear-gradient(160deg, #2a0410 0%, #4a0819 30%, #87102C 70%, #a01535 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 text-white">
        <Sparkles size={36} className="mx-auto mb-5 text-[#FFB3C1] opacity-60" />
        <p className="text-3xl sm:text-4xl font-bold font-serif italic mb-2">
          Heaven on Earth
        </p>
        <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-semibold mb-6">
          {HEAVEN_ON_EARTH.dateDisplay}
        </p>
        <p className="text-xs text-white/35 leading-relaxed max-w-[200px] mx-auto">
          {loading
            ? "Loading event flyer…"
            : `Drop your flyer at ${HEAVEN_ON_EARTH.flyerImagePath} to display it here.`}
        </p>
      </div>
    </div>
  );
}
