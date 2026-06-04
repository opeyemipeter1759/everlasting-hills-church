"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { useDirections } from "../../utils/UseDirection";
import DirectionsModal from "./DirectionModal";
import ContactSection from "./ContactSection";
import { CHURCH } from "@/config/config";

/**
 * Find-us / contact hero.
 *
 * Pattern: SPLIT-SCREEN HERO on a dark cosmic ground — glassmorphic anchor-info
 * chips (location, phone, email, WhatsApp) on one side, a framed live map on the
 * other, and a full-bleed Get Directions CTA at the bottom. The contact form lives
 * in the light ContactSection below.
 */

const EASE = [0.22, 1, 0.36, 1] as const;
const MAP_EMBED_URL = `https://www.google.com/maps?q=${CHURCH.lat},${CHURCH.lng}&z=15&output=embed`;
const PHONE = "+234 706 872 7719";
const EMAIL = "hello@everlastinghills.org";
const WHATSAPP_URL = "https://wa.me/2347068727719";

const CHIPS: { icon: LucideIcon; eyebrow: string; value: string; href: string }[] = [
  {
    icon: MapPin,
    eyebrow: "Our Location",
    value: CHURCH.address,
    href: `https://www.google.com/maps/search/?api=1&query=${CHURCH.lat},${CHURCH.lng}`,
  },
  {
    icon: Phone,
    eyebrow: "Phone",
    value: PHONE,
    href: `tel:${PHONE.replace(/\s/g, "")}`,
  },
  {
    icon: Mail,
    eyebrow: "Email",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
  },
  {
    icon: MessageCircle,
    eyebrow: "WhatsApp",
    value: "Chat with us",
    href: WHATSAPP_URL,
  },
];

export default function CosmicContactHero() {
  const directions = useDirections();

  return (
    <main className="relative overflow-hidden bg-church-dark text-white">
      {/* Cosmic background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] h-[60%] w-[60%] rounded-full bg-[#87102C]/15 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full bg-[#87102C]/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.4) 1px, transparent 0), radial-gradient(1px 1px at 70% 60%, rgba(255,255,255,0.3) 1px, transparent 0), radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.35) 1px, transparent 0), radial-gradient(1px 1px at 85% 20%, rgba(255,255,255,0.3) 1px, transparent 0), radial-gradient(1px 1px at 15% 70%, rgba(255,255,255,0.25) 1px, transparent 0)",
            backgroundSize: "300px 300px",
          }}
        />
      </div>

      <section className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8 pt-28 sm:pt-32 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="max-w-3xl"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/60 backdrop-blur-sm">
            <MapPin size={12} className="text-[#e8768a]" />
            Find us
          </span>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight">
            Find Your{" "}
            <span className="bg-gradient-to-r from-[#e8768a] via-[#c93860] to-[#87102C] bg-clip-text font-serif italic text-transparent">
              Way Home
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-white/60">
            We would love to welcome you. Come and experience God&apos;s presence
            with us, there is always a place for you here.
          </p>
        </motion.div>

        {/* Split-screen: info chips + map */}
        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
          {/* Anchor-info chips */}
          <div className="space-y-4">
            {CHIPS.map((chip, i) => (
              <InfoChip key={chip.eyebrow} {...chip} delay={0.2 + i * 0.08} />
            ))}
          </div>

          {/* Map visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: EASE }}
            className="relative min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-sm lg:min-h-0"
          >
            <iframe
              src={MAP_EMBED_URL}
              className="h-full w-full grayscale-[0.5] contrast-110"
              style={{ minHeight: "320px" }}
              loading="lazy"
              title="Church location map"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#87102C]/20 via-transparent to-black/30" />
          </motion.div>
        </div>

        {/* Full-bleed CTA */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55, ease: EASE }}
          type="button"
          onClick={directions.handleGetDirections}
          className="group mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#87102C] to-[#a52242] px-6 py-4 text-sm font-bold shadow-lg shadow-[#87102C]/30 transition-all hover:-translate-y-0.5 hover:from-[#6E0C24] hover:to-[#87102C] hover:shadow-xl hover:shadow-[#87102C]/40"
        >
          <Navigation size={16} />
          Get Directions
          <ExternalLink
            size={14}
            className="opacity-70 transition-transform group-hover:translate-x-0.5"
          />
        </motion.button>
      </section>

      {/* Contact form (light) */}
      <div className="relative z-10">
        <ContactSection />
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

function InfoChip({
  icon: Icon,
  eyebrow,
  value,
  href,
  delay = 0,
}: {
  icon: LucideIcon;
  eyebrow: string;
  value: string;
  href: string;
  delay?: number;
}) {
  const external = href.startsWith("http");
  return (
    <motion.a
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/[0.06] sm:p-5"
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#87102C]/20 text-[#e8768a] transition-all group-hover:scale-105 group-hover:bg-[#87102C]/30">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
          {eyebrow}
        </p>
        <p className="truncate text-sm font-medium text-white">{value}</p>
      </div>
      <ArrowUpRight
        size={16}
        className="flex-shrink-0 text-white/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white"
      />
    </motion.a>
  );
}
