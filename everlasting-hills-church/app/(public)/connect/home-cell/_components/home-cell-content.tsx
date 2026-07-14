"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  BookOpen,
  Heart,
  ShieldCheck,
  Sprout,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
} from "lucide-react";

// ── Benefits ──────────────────────────────────────────────────────────────────

const BENEFITS = [
  { icon: BookOpen,    title: "Deep in the Word",  body: "Study Scripture in an intimate circle where questions are welcomed and truth goes root-deep." },
  { icon: Users,       title: "Real Community",     body: "Move beyond Sunday handshakes into relationships where people actually know your name." },
  { icon: Sprout,      title: "Discipleship",       body: "Be poured into and pour into others — growing together toward Christlikeness." },
  { icon: ShieldCheck, title: "Accountability",     body: "Trusted voices who walk with you, pray with you, and help you stay the course." },
  { icon: Heart,       title: "Fellowship",         body: "Share meals, carry burdens, and celebrate life — the way the early church did." },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "What exactly is a Home Cell?",
    a: "A Home Cell is a small, home-based gathering of believers who worship, study the Word, and grow together in close community. It's the most personal expression of church life at Everlasting Hills.",
  },
  {
    q: "Where are Home Cells located?",
    a: "Cells are spread across different neighbourhoods in Lagos and beyond. We match you to a group close to where you live or work — and if there isn't one nearby yet, you could help start one.",
  },
  {
    q: "How does a Home Cell help me grow spiritually?",
    a: "Through weekly Scripture study, honest conversation, prayer, and real accountability, you grow faster than you ever would alone. Every Cell Leader is trained to guide and support their group.",
  },
  {
    q: "How do I join a Home Cell?",
    a: "Speak to our pastoral or connect team on Sunday, or reach out through the church. We'll match you with a cell group in your area and introduce you to the Cell Leader before your first meeting.",
  },
  {
    q: "How is a Home Cell different from a Sunday service?",
    a: "Sunday is where we gather as one body. A Home Cell is where you are truly known — a smaller circle with space for questions, personal prayer, and the kind of depth that a large gathering can't provide.",
  },
  {
    q: "Can I start a Home Cell in my home?",
    a: "Absolutely. If you feel called to host and lead, speak with the Discipleship team. We provide training, materials, and ongoing pastoral support for every Cell Leader who steps up.",
  },
];

// ── People images ─────────────────────────────────────────────────────────────

const PEOPLE_IMAGES = [
  "/HeroImages/IMG_8931.jpg",
  "/HeroImages/IMG_1080.jpg",
  "/HeroImages/IMG_8248.jpg",
  "/HeroImages/IMG_4667.jpg",
  "/HeroImages/IMG_8470.jpg",
  "/HeroImages/IMG_5684.jpg",
];

// ── FAQ Accordion ─────────────────────────────────────────────────────────────

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className="border-b border-white/[0.07] last:border-0"
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-start justify-between gap-6 py-6 text-left group"
        aria-expanded={open}
      >
        <span className="font-display font-black text-base sm:text-lg text-white/80 group-hover:text-white transition-colors leading-snug">
          {q}
        </span>
        <span className="flex-shrink-0 w-7 h-7 rounded-full border border-white/15 flex items-center justify-center mt-0.5 group-hover:border-church-accent/50 group-hover:text-church-accent text-white/40 transition-all">
          {open ? <Minus size={13} /> : <Plus size={13} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-white/45 text-[15px] leading-relaxed max-w-2xl">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Page content ──────────────────────────────────────────────────────────────

interface Props {
  heroImageUrl: string;
}

export default function HomeCellContent({ heroImageUrl }: Props) {
  return (
    <main className="min-h-screen bg-church-dark text-white selection:bg-church-maroon selection:text-white overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-end overflow-hidden">

        <div className="absolute inset-0 z-0">
          <img
            src={heroImageUrl}
            alt="Everlasting Hills church family"
            className="w-full h-full object-cover object-center scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/60 to-church-dark/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-church-dark/80 via-transparent to-transparent" />
        </div>

        <div className="absolute top-24 left-6 sm:left-10 z-20">
          <Link
            href="/connect"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Connect</span>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="absolute top-28 right-6 sm:right-10 z-20 hidden sm:flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur-md px-4 py-2"
        >
          <span className="w-2 h-2 rounded-full bg-church-accent animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/60">Weekly · Citywide</span>
        </motion.div>

        <div className="relative z-10 px-6 sm:px-10 lg:px-16 pb-20 md:pb-28 max-w-5xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[10px] font-black uppercase tracking-[0.5em] text-church-accent mb-5"
          >
            Home Cell
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(3rem,10vw,7.5rem)] font-display font-black tracking-tighter leading-[0.87] mb-8"
          >
            Life happens<br />
            <em className="font-serif not-italic font-normal text-church-accent">
              in small groups.
            </em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-white/55 text-base sm:text-lg leading-relaxed max-w-xl mb-10"
          >
            A Home Cell is where the Church becomes a family — a small circle of believers
            who meet weekly to pray, study, and carry life together.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-wrap items-center gap-4"
          >
            <a
              href="/connect/home-cell/find"
              className="inline-flex items-center gap-2 rounded-full bg-church-maroon px-8 py-4 text-sm font-black text-white tracking-wide transition-all hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-church-maroon/40"
            >
              Find your cell <ChevronRight size={15} />
            </a>
            <a
              href="#what"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-white/40 hover:text-white/70 transition-colors"
            >
              Learn more <ChevronDown size={14} />
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 right-8 z-10 hidden lg:flex flex-col items-center gap-2"
        >
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 [writing-mode:vertical-rl]">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          WHAT IS A HOME CELL
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="what" className="py-24 md:py-32 px-6 sm:px-10 lg:px-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          <div>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-[10px] font-black uppercase tracking-[0.45em] text-church-accent mb-5"
            >
              What is a Home Cell?
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-5xl font-display font-black tracking-tight leading-[1.05] mb-8"
            >
              Church beyond<br />
              <span className="font-serif italic font-normal text-white/45">Sunday morning.</span>
            </motion.h2>
            <div className="space-y-4 text-white/50 text-[15px] leading-relaxed">
              <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                A Home Cell is a small group of 6–15 believers who gather weekly — in someone's home, over a meal, around the Word. It is the most intimate expression of church life at Everlasting Hills.
              </motion.p>
              <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                Each cell is led by a trained Cell Leader who facilitates discussion, coordinates prayer, and pastors the group through every season of life — from mountaintops to valleys.
              </motion.p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="relative"
          >
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-church-maroon/30 via-transparent to-transparent" />
            <div className="relative glass-card p-10 sm:p-12">
              <p className="text-[7rem] font-serif leading-none text-church-maroon/20 mb-2 -mt-4">&ldquo;</p>
              <blockquote className="text-xl sm:text-2xl font-display font-black leading-snug text-white/80 mb-6 -mt-8">
                They broke bread in their homes and ate together with glad and sincere hearts.
              </blockquote>
              <cite className="text-[11px] font-black uppercase tracking-[0.3em] text-church-accent/60 not-italic">
                Acts 2 : 46
              </cite>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          BENEFITS
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-28 px-6 sm:px-10 lg:px-16 border-t border-white/[0.06] relative overflow-hidden">
        <div className="pointer-events-none absolute -right-40 top-0 w-[600px] h-[600px] rounded-full bg-church-maroon/8 blur-[140px]" />

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-16">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-church-accent mb-3">Why join?</p>
              <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight leading-[1.05]">
                Five things that<br />
                <span className="font-serif italic font-normal text-white/40">change when you join.</span>
              </h2>
            </div>
            <p className="text-white/30 text-sm max-w-[18rem] leading-relaxed">
              Real transformation doesn't happen in an auditorium — it happens in a living room.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.06] rounded-3xl overflow-hidden">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`bg-church-dark p-8 sm:p-10 group hover:bg-[#110208] transition-colors duration-300 ${i === 4 ? "sm:col-span-2 lg:col-span-1" : ""}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-church-maroon/15 flex items-center justify-center mb-6 text-church-accent group-hover:bg-church-maroon group-hover:scale-110 transition-all duration-300">
                  <b.icon size={20} strokeWidth={1.8} />
                </div>
                <h3 className="font-display font-black text-xl tracking-tight text-white mb-3 group-hover:text-church-accent transition-colors duration-300">
                  {b.title}
                </h3>
                <p className="text-white/40 text-[14px] leading-relaxed">{b.body}</p>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="bg-church-maroon/10 border-0 p-8 sm:p-10 flex flex-col justify-between"
            >
              <p className="text-[clamp(3.5rem,6vw,5rem)] font-display font-black text-church-accent leading-none">
                100<span className="text-4xl">%</span>
              </p>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/35 mt-4">
                Free to join.<br />No commitment needed<br />for your first visit.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PEOPLE — photo mosaic
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="join" className="py-24 md:py-32 px-6 sm:px-10 lg:px-16 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-3 grid-rows-2 gap-3 h-[420px] sm:h-[500px]"
            >
              <div className="col-span-1 row-span-2 rounded-2xl overflow-hidden">
                <img src={PEOPLE_IMAGES[0]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="col-span-2 rounded-2xl overflow-hidden">
                <img src={PEOPLE_IMAGES[1]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="col-span-1 rounded-2xl overflow-hidden">
                <img src={PEOPLE_IMAGES[2]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              <div className="col-span-1 rounded-2xl overflow-hidden">
                <img src={PEOPLE_IMAGES[3]} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.45em] text-church-accent mb-5">
                A place for everyone
              </p>
              <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight leading-[1.05] mb-8">
                You belong<br />
                <span className="font-serif italic font-normal text-white/45">in a room like this.</span>
              </h2>
              <p className="text-white/45 text-[15px] leading-relaxed max-w-sm">
                Home Cells at Everlasting Hills aren't programmes — they're people. People who will
                remember your name, check in on you, celebrate your wins, and sit with you in the
                hard seasons. This is the church being the church.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-24 md:py-28 px-4 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14">
            <p className="text-[10px] font-black uppercase tracking-[0.45em] text-church-accent mb-4">FAQ</p>
            <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight leading-[1.05]">
              Honest answers<br />
              <span className="font-serif italic font-normal text-white/40">to honest questions.</span>
            </h2>
          </div>
          <div>
            {FAQS.map((item, i) => (
              <FaqItem key={i} {...item} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CLOSING BANNER
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-32 px-6 text-center border-t border-white/[0.06]">
        <div className="pointer-events-none absolute inset-0">
          <img src="/HeroImages/IMG_4565.jpg" alt="" className="w-full h-full object-cover opacity-15 scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-church-dark via-church-dark/70 to-church-dark" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[10px] font-black uppercase tracking-[0.5em] text-church-accent mb-5"
          >
            Ready?
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-4xl sm:text-6xl font-display font-black tracking-tight leading-[1.05] mb-8"
          >
            Don&rsquo;t do life alone.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="text-white/45 text-base leading-relaxed mb-10"
          >
            Your Home Cell is out there. A group of people who will pray with you,
            celebrate with you, and walk with you through every season.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.26 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/connect/home-cell/find"
              className="inline-flex items-center gap-2 rounded-full bg-church-maroon px-9 py-4 font-black text-sm text-white tracking-wide hover:bg-[#6E0C24] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-church-maroon/40 transition-all"
            >
              Find a Cell Near You <ChevronRight size={15} />
            </Link>
            <Link
              href="/connect"
              className="text-sm font-bold text-white/35 hover:text-white/65 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={13} /> Back to Connect
            </Link>
          </motion.div>
        </div>
      </section>

    </main>
  );
}
