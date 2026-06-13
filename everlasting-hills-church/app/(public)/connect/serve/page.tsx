"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Heart,
  Monitor,
  PenTool,
  Globe,
  Megaphone,
  Music,
  Users,
  Star,
  PhoneCall,
  BookOpen,
  ClipboardList,
  Banknote,
  Package,
  Database,
  X,
  ArrowRight,
  Send,
  ArrowLeft,
  CheckCircle,
  MapPin,
} from "lucide-react";
import ScrollReveal from "@/components/home/ScrollReveal";
import { apiClient } from "@/lib/api/axios";

// ── Unit definitions ──────────────────────────────────────────────────────────

type Unit = {
  id: string;
  name: string;
  icon: React.ElementType;
  category: string;
  description: string;
};

const UNITS: Unit[] = [
  {
    id: "welfare",
    name: "Welfare Team",
    icon: Heart,
    category: "Pastoral",
    description:
      "We care for the practical and pastoral needs of the congregation — ensuring no one carries their burdens alone.",
  },
  {
    id: "production",
    name: "Production Team",
    icon: Monitor,
    category: "Technical",
    description:
      "We handle sound, livestream, projection, and post-production — making sure every message reaches every screen and ear.",
  },
  {
    id: "design",
    name: "Design Team",
    icon: PenTool,
    category: "Creative",
    description:
      "We shape the visual identity of Everlasting Hills — graphics, materials, and the imagery that tells our story.",
  },
  {
    id: "social-media",
    name: "Social Media & Content",
    icon: Globe,
    category: "Creative",
    description:
      "We extend the reach of the house through compelling content that connects, inspires, and invites people in.",
  },
  {
    id: "communications",
    name: "Communications Team",
    icon: Megaphone,
    category: "Admin",
    description:
      "We keep the congregation informed and engaged — internal messaging, announcements, and coordination.",
  },
  {
    id: "worship",
    name: "Worship Team",
    icon: Music,
    category: "Ministry",
    description:
      "We lead the congregation into the presence of God through music, voice, and the Spirit.",
  },
  {
    id: "ushering",
    name: "Ushering Team",
    icon: Users,
    category: "Hospitality",
    description:
      "We are the first face of the house — welcoming, guiding, and creating order in every gathering.",
  },
  {
    id: "children",
    name: "Children's Team",
    icon: Star,
    category: "Ministry",
    description:
      "We serve the next generation — creating safe, joyful, faith-filled environments for our youngest members.",
  },
  {
    id: "follow-up",
    name: "Follow-Up Team",
    icon: PhoneCall,
    category: "Pastoral",
    description:
      "We walk alongside new faces and first-timers, connecting them to the family through intentional follow-up.",
  },
  {
    id: "discipleship",
    name: "Discipleship Team",
    icon: BookOpen,
    category: "Ministry",
    description:
      "We build men and women of the Word — through study, mentorship, and life-on-life accountability.",
  },
  {
    id: "coordination",
    name: "Service Coordination",
    icon: ClipboardList,
    category: "Admin",
    description:
      "We ensure services run with excellence — coordinating every moving part behind what the congregation experiences.",
  },
  {
    id: "finance",
    name: "Finance Team",
    icon: Banknote,
    category: "Admin",
    description:
      "We steward the resources of the house with integrity, transparency, and excellence.",
  },
  {
    id: "logistics",
    name: "Logistics & Setup Team",
    icon: Package,
    category: "Operations",
    description:
      "We prepare the physical space for encounter — setup, teardown, and all the behind-the-scenes work that makes gatherings possible.",
  },
  {
    id: "records",
    name: "Records, Database & Website",
    icon: Database,
    category: "Technical",
    description:
      "We maintain the systems that power the house — member records, data integrity, and the digital presence of EHC.",
  },
];


// ── Join modal ────────────────────────────────────────────────────────────────

type JoinForm = { name: string; email: string; phone: string; message: string };

function JoinModal({
  unit,
  onClose,
}: {
  unit: Unit;
  onClose: () => void;
}) {
  const [form, setForm] = useState<JoinForm>({ name: "", email: "", phone: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post("/forms/serve-team", {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        unit: unit.name,
        message: form.message || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#E7CDD3]/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] flex items-center justify-center text-[#87102C] flex-shrink-0">
              <unit.icon size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#87102C] mb-0.5">
                Join Team
              </p>
              <h3 className="text-[#111] font-bold text-base leading-tight">{unit.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#999] hover:text-[#111] hover:bg-[#FFF4F6] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-[#FFE8ED] flex items-center justify-center mb-4">
                <CheckCircle size={26} className="text-[#87102C]" />
              </div>
              <h4 className="text-[#111] font-bold text-xl mb-2">You're in!</h4>
              <p className="text-[#666] text-sm leading-relaxed max-w-xs">
                Thanks for stepping up. Our team will reach out to you about the{" "}
                <strong className="text-[#111]">{unit.name}</strong> soon.
              </p>
              <button
                onClick={onClose}
                className="mt-6 px-6 py-3 rounded-full bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all"
              >
                Done
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="join-name" className="block text-[#444] text-sm font-medium mb-1.5">
                  Your Name
                </label>
                <input
                  id="join-name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Tunde Adeyemi"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7CDD3] bg-[#FFF4F6]/50 text-[#111] placeholder:text-[#bbb] text-sm focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="join-email" className="block text-[#444] text-sm font-medium mb-1.5">
                  Email Address
                </label>
                <input
                  id="join-email"
                  name="email"
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7CDD3] bg-[#FFF4F6]/50 text-[#111] placeholder:text-[#bbb] text-sm focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="join-phone" className="block text-[#444] text-sm font-medium mb-1.5">
                  Phone Number <span className="text-[#bbb] font-normal">(optional)</span>
                </label>
                <input
                  id="join-phone"
                  name="phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7CDD3] bg-[#FFF4F6]/50 text-[#111] placeholder:text-[#bbb] text-sm focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="join-message" className="block text-[#444] text-sm font-medium mb-1.5">
                  Anything to share? <span className="text-[#bbb] font-normal">(optional)</span>
                </label>
                <textarea
                  id="join-message"
                  name="message"
                  rows={3}
                  placeholder="Skills, experience, or anything you'd like us to know…"
                  value={form.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-[#E7CDD3] bg-[#FFF4F6]/50 text-[#111] placeholder:text-[#bbb] text-sm focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C] transition-all resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-full bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <Send size={14} className={isLoading ? "animate-pulse" : ""} />
                {isLoading ? "Sending…" : "Join This Team"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Unit card ─────────────────────────────────────────────────────────────────

function UnitCard({ unit, index, onJoin }: { unit: Unit; index: number; onJoin: () => void }) {
  const Icon = unit.icon;
  return (
    <ScrollReveal delay={0.05 + (index % 3) * 0.08}>
      <div className="group bg-white border border-[#E7CDD3]/60 rounded-2xl p-6 hover:shadow-[0_8px_40px_rgba(135,16,44,0.10)] hover:border-[#E7CDD3] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-[#FFE8ED] flex items-center justify-center text-[#87102C] flex-shrink-0 mb-4">
          <Icon size={20} />
        </div>

        {/* Name */}
        <h3 className="text-[#111] font-bold text-lg leading-tight mb-2 group-hover:text-[#87102C] transition-colors">
          {unit.name}
        </h3>

        {/* Description */}
        <p className="text-[#666] text-sm leading-relaxed flex-1 mb-5">{unit.description}</p>

        {/* Join button */}
        <button
          onClick={onJoin}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E7CDD3] text-[#87102C] text-sm font-semibold hover:bg-[#87102C] hover:text-white hover:border-[#87102C] transition-all duration-200"
        >
          Join This Team
          <ArrowRight size={14} />
        </button>
      </div>
    </ScrollReveal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ServeTeamPage() {
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  return (
    <main className="bg-white text-[#111]">

      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden"
        style={{
          backgroundImage: "url('/images/church_congregation_2_1779193607195.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/65 to-black/80 pointer-events-none" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-52 pb-44 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center gap-4"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-white/60 backdrop-blur-sm">
              <MapPin size={12} className="text-[#FFB3C1]" />
              Serve the House
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-[1.05] text-balance">
              Find your{" "}
              <span className="bg-gradient-to-r from-[#FFB3C1] via-[#e8768a] to-[#c93860] bg-clip-text text-transparent italic font-serif">
                place to build.
              </span>
            </h1>

            <p className="text-white/55 text-base sm:text-lg leading-relaxed max-w-xl">
              Every gift matters. Every hand builds. Find the team where your calling and the
              needs of the house meet — and step in.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <a
                href="#teams"
                className="px-6 py-3 rounded-full bg-white text-[#87102C] text-sm font-semibold hover:bg-[#FFE8ED] hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
              >
                See All Teams
              </a>
              <Link
                href="/connect"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-all"
              >
                <ArrowLeft size={14} />
                Back to Connect
              </Link>
            </div>
          </motion.div>
        </div>


      </div>

      {/* ── Teams grid ── */}
      <section id="teams" className="py-24 md:py-32 bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8">
          {/* Section header */}
          <div className="max-w-2xl mb-16">
            <ScrollReveal>
              <p className="text-[#87102C] text-sm tracking-[0.2em] uppercase font-semibold mb-3">
                Service Units
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] leading-[1.1] tracking-tight text-balance">
                Where will you{" "}
                <span className="text-[#87102C]">build?</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="mt-4 text-[#555] text-base sm:text-lg leading-relaxed">
                Everlasting Hills has {UNITS.length} active service teams. Each one is a living part of
                the house. Browse them below and click <em className="not-italic font-semibold text-[#111]">Join</em> on the
                team that speaks to you.
              </p>
            </ScrollReveal>
          </div>

          {/* Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {UNITS.map((unit, i) => (
              <UnitCard
                key={unit.id}
                unit={unit}
                index={i}
                onJoin={() => setSelectedUnit(unit)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Join modal ── */}
      <AnimatePresence>
        {selectedUnit && (
          <JoinModal unit={selectedUnit} onClose={() => setSelectedUnit(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}
