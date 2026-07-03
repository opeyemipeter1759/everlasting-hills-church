"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useDirections } from "../../utils/UseDirection";
import DirectionsModal from "./DirectionModal";
import ContactSection from "./ContactSection";

export interface CosmicContactHeroProps {
  eyebrow?: string;
  title?: string;
  accent?: string;
  subtitle?: string;
}

export default function CosmicContactHero({
  eyebrow = "Get in Touch",
  title = "Connect",
  accent = "With Us",
  subtitle = "We would love to hear from you. Reach out — there is always a place for you in the Everlasting Hills family.",
}: CosmicContactHeroProps = {}) {
  const directions = useDirections();

  return (
    <main className="bg-white text-white">

      {/* ── Hero: background image + dark overlay + simple text ── */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: "url('/images/church_congregation_1_1779193592146.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-52 pb-44 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/60 backdrop-blur-sm">
              <MapPin size={12} className="text-[#e8768a]" />
              {eyebrow}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.05] text-balance">
              {title}{" "}
              <span className="bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#FFB3C1] bg-clip-text text-transparent italic font-serif">
                {accent}
              </span>
            </h1>

            <p className="text-white/55 text-base sm:text-lg leading-relaxed max-w-xl">
              {subtitle}
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Contact Section ── */}
      <ContactSection />

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
    </main>
  );
}
