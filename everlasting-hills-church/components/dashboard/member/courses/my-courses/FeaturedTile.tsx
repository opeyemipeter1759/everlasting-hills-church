import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ICON_OPTIONS } from "@/lib/courses-data";
import type { CourseListItem } from "@/lib/api/courses";

/** Circular alternative to a linear progress bar — reads better inside a compact tile. */
function ProgressRing({ pct, size = 64, stroke = 5 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90" role="img" aria-label={`${pct}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#fff"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-500"
      />
    </svg>
  );
}

/** The hero tile: the in-progress course furthest along, with a way straight back in. */
export function FeaturedTile({ course, pct, className }: { course: CourseListItem; pct: number; className?: string }) {
  const Icon = ICON_OPTIONS[course.iconKey] ?? ICON_OPTIONS.BookOpen;
  const [from, to] = course.gradient;

  return (
    <Link
      href={`/dashboard/courses/${course.slug}`}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl p-5 text-white transition-all hover:-translate-y-0.5 hover:shadow-xl sm:p-6 ${className ?? ""}`}
      style={{ background: `linear-gradient(150deg, ${from} 0%, ${to} 100%)` }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-black/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Continue learning</p>
          <h3 className="mt-2 text-lg font-bold leading-tight sm:text-2xl">{course.title}</h3>
          <p className="mt-1.5 max-w-xs text-sm text-white/70 line-clamp-2">{course.tagline}</p>
        </div>
        <div className="relative flex-shrink-0">
          <ProgressRing pct={pct} size={60} stroke={5} />
          <Icon size={20} className="absolute inset-0 m-auto text-white" strokeWidth={1.75} />
        </div>
      </div>

      <div className="relative mt-6 flex items-center justify-between gap-3 sm:mt-8">
        <span className="text-sm font-bold tabular-nums text-white/90">{pct}% complete</span>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold backdrop-blur-sm transition-colors group-hover:bg-white/25">
          Continue <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
