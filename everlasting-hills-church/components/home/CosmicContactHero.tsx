"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useDirections } from "../../utils/UseDirection";
import DirectionsModal from "./DirectionModal";
import { CHURCH } from "@/config/config";

/**
 * Cosmic find-us page hero.
 *
 * Pattern: split-screen cosmic dark theme with bento info cards on the right and
 * an animated WebGL globe on the left (Stripe / Linear marketing aesthetic).
 *
 * Globe is loaded client-only via next/dynamic (WebGL has no SSR equivalent).
 */

const Globe = dynamic(() => import("./Globe"), { ssr: false });

// Embed-friendly Google Maps URL for the church location
const MAP_EMBED_URL = `https://www.google.com/maps?q=${CHURCH.lat},${CHURCH.lng}&z=15&output=embed`;

const CONTACT_PHONE = "+234 706 872 7719";
const CONTACT_EMAIL = "hello@everlastinghills.org";

export default function CosmicContactHero() {
  const directions = useDirections();

  return (
    <main className="relative min-h-screen overflow-hidden bg-church-dark text-white">
      {/* ── Cosmic background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#87102C]/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#87102C]/10 blur-[120px] rounded-full" />
        {/* Subtle starfield via repeated radial gradients */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4) 1px, transparent 0), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.3) 1px, transparent 0), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.35) 1px, transparent 0), radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,0.3) 1px, transparent 0), radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.25) 1px, transparent 0)",
            backgroundSize: "300px 300px",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-5 sm:px-8 pt-24 pb-16">
        {/* Hero headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12 lg:mb-16 max-w-3xl"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/60 backdrop-blur-sm mb-6">
            <MapPin size={12} className="text-[#e8768a]" />
            Find us
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]">
            Find Your{" "}
            <span className="bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#87102C] bg-clip-text text-transparent italic font-serif">
              Way Home
            </span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-white/60 leading-relaxed max-w-xl">
            We would love to welcome you. Come and experience God&apos;s presence
            with us — there is always a place for you here.
          </p>
        </motion.div>

        {/* Split-screen: globe + bento cards */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* LEFT: animated globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex items-center justify-center min-h-[400px] lg:min-h-[500px]"
          >
            <Globe size={520} label={`${CHURCH.address.split(",")[0]}, Nigeria`} />
          </motion.div>

          {/* RIGHT: bento info cards */}
          <div className="space-y-4">
            <InfoCard
              icon={<MapPin size={18} />}
              eyebrow="Our Location"
              primary={CHURCH.address}
              href={`https://www.google.com/maps/search/?api=1&query=${CHURCH.lat},${CHURCH.lng}`}
              delay={0.3}
            />

            <InfoCard
              icon={<Phone size={18} />}
              eyebrow="Phone"
              primary={CONTACT_PHONE}
              href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
              delay={0.4}
            />

            <InfoCard
              icon={<Mail size={18} />}
              eyebrow="Email"
              primary={CONTACT_EMAIL}
              href={`mailto:${CONTACT_EMAIL}`}
              delay={0.5}
            />

            {/* Map preview */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] backdrop-blur-sm h-48 sm:h-56"
            >
              {/*
                Embedded Google Map. We use a tinted overlay to dim the bright default map
                colors and keep visual harmony with the cosmic theme.
              */}
              <div className="relative w-full h-full">
                <iframe
                  src={MAP_EMBED_URL}
                  className="w-full h-full grayscale-[0.5] contrast-110"
                  loading="lazy"
                  title="Church location map"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#87102C]/20 via-transparent to-black/30 pointer-events-none" />
              </div>
            </motion.div>

            {/* Full-bleed CTA */}
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              type="button"
              onClick={directions.handleGetDirections}
              className="group w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#87102C] to-[#a52242] hover:from-[#6E0C24] hover:to-[#87102C] px-6 py-4 font-bold text-sm transition-all shadow-lg shadow-[#87102C]/30 hover:shadow-xl hover:shadow-[#87102C]/40 hover:-translate-y-0.5"
            >
              <Navigation size={16} />
              Get Directions
              <ExternalLink
                size={14}
                className="opacity-70 group-hover:translate-x-0.5 transition-transform"
              />
            </motion.button>
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
    </main>
  );
}

// ── Info card subcomponent ──────────────────────────────────────────────────

interface InfoCardProps {
  icon: React.ReactNode;
  eyebrow: string;
  primary: string;
  href: string;
  delay?: number;
}

function InfoCard({ icon, eyebrow, primary, href, delay = 0 }: InfoCardProps) {
  return (
    <motion.a
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 backdrop-blur-md p-4 sm:p-5 transition-all"
    >
      <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#87102C]/20 text-[#e8768a] flex items-center justify-center group-hover:bg-[#87102C]/30 group-hover:scale-105 transition-all">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1">
          {eyebrow}
        </p>
        <p className="text-sm text-white font-medium truncate">{primary}</p>
      </div>
      <ArrowUpRight
        size={16}
        className="text-white/30 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all flex-shrink-0"
      />
    </motion.a>
  );
}
