"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

export interface RecentSermon {
  id: string;
  slug: string;
  title: string;
  speaker: string;
  preachedAt: string;
  series: string | null;
  description: string | null;
  mediaType: "audio" | "video" | "both";
  ctaLabel: "Watch" | "Listen";
  videoUrl: string | null;
  audioUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Deterministic (UTC) date format — no locale, so SSR and client agree. */
function formatPreachedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default function RecentSermonsGrid({ sermons }: { sermons: RecentSermon[] }) {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.11 } },
  };
  const item = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.4 } } }
    : {
        hidden: { opacity: 0, y: 24 },
        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
      };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {sermons.map((sermon) => (
        <motion.div key={sermon.id} variants={item} className="h-full">
          <SermonCard sermon={sermon} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function SermonCard({ sermon }: { sermon: RecentSermon }) {
  const dateLabel = formatPreachedAt(sermon.preachedAt);

  return (
    <Link
      href={`/sermons/${sermon.slug}`}
      aria-label={`${sermon.ctaLabel} ${sermon.title} by ${sermon.speaker}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
    >
      {/* Media — fixed 16/9 either way */}
      <div className="relative aspect-video overflow-hidden">
        {sermon.thumbnailUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sermon.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(135deg, #87102C 0%, #4a0819 100%)",
              backgroundSize: "14px 14px, 100% 100%",
            }}
          />
        )}

        {/* Centered play — fills burgundy on hover */}
        <span className="absolute inset-0 grid place-items-center">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:border-transparent group-hover:bg-[#87102C]"
          >
            <Play className="h-5 w-5 translate-x-[1px] text-white" fill="currentColor" />
          </span>
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Badge row — height reserved so badged/unbadged cards align */}
        <div className="mb-3 flex h-6 items-start">
          {sermon.series && (
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/75">
              {sermon.series}
            </span>
          )}
        </div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFB3C1]">
          {sermon.speaker}
          {dateLabel ? ` · ${dateLabel}` : ""}
        </p>

        <h3 className="mt-2 font-serif text-xl font-bold leading-snug tracking-tight text-white line-clamp-2">
          {sermon.title}
        </h3>

        {sermon.description && (
          <p className="mt-2 text-sm leading-relaxed text-white/55 line-clamp-1">
            {sermon.description}
          </p>
        )}

        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[#FFB3C1] transition-all group-hover:gap-2.5">
          {sermon.ctaLabel}
          <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
