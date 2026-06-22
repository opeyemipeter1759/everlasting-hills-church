'use client';

import { useRouter } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Layers,
  Mic2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useSermonAdminOverview } from '@/lib/api';
import type { StatCardProps } from '@/types';
import { StatCard } from '@/components/ui/cards/StatCard';

/* ── stat config ───────────────────────────────────────────────────── */
const STATS: Omit<StatCardProps, 'value' | 'loading'>[] = [
  {
    label: 'Total Sermons',
    icon: <BookOpen size={19} strokeWidth={2} />,
    iconBg: 'bg-[#87102C]/10 dark:bg-[#87102C]/25',
    iconColor: 'text-[#87102C] dark:text-[#e8768a]',
    glowFrom: 'from-[#87102C]/20',
    glowTo: 'to-rose-500/5',
    accentBar: 'from-[#87102C] via-rose-500 to-[#87102C]/20',
    description: 'All messages ever added',
  },
  {
    label: 'Published',
    icon: <CheckCircle2 size={19} strokeWidth={2} />,
    iconBg: 'bg-emerald-50 dark:bg-emerald-500/15',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    glowFrom: 'from-emerald-400/20',
    glowTo: 'to-teal-400/5',
    accentBar: 'from-emerald-400 via-teal-500 to-emerald-400/20',
    description: 'Live & accessible',
  },
  {
    label: 'Drafts',
    icon: <FileText size={19} strokeWidth={2} />,
    iconBg: 'bg-amber-50 dark:bg-amber-500/15',
    iconColor: 'text-amber-600 dark:text-amber-400',
    glowFrom: 'from-amber-400/20',
    glowTo: 'to-orange-400/5',
    accentBar: 'from-amber-400 via-orange-500 to-amber-400/20',
    description: 'Pending publication',
  },
  {
    label: 'Series',
    icon: <Layers size={19} strokeWidth={2} />,
    iconBg: 'bg-violet-50 dark:bg-violet-500/15',
    iconColor: 'text-violet-600 dark:text-violet-400',
    glowFrom: 'from-violet-400/20',
    glowTo: 'to-purple-400/5',
    accentBar: 'from-violet-400 via-purple-500 to-violet-400/20',
    description: 'Multi-part series',
  },
  {
    label: 'Singles',
    icon: <Mic2 size={19} strokeWidth={2} />,
    iconBg: 'bg-sky-50 dark:bg-sky-500/15',
    iconColor: 'text-sky-600 dark:text-sky-400',
    glowFrom: 'from-sky-400/20',
    glowTo: 'to-blue-400/5',
    accentBar: 'from-sky-400 via-blue-500 to-sky-400/20',
    description: 'Standalone messages',
  },
];

/* ── component ─────────────────────────────────────────────────────── */
export default function SermonHeading() {
  const router = useRouter();
  const { data: overview, isLoading } = useSermonAdminOverview();

  const values: Record<string, number | undefined> = {
    'Total Sermons': overview?.totalSermons,
    Published: overview?.totalPublished,
    Drafts: overview?.totalDrafted,
    Series: overview?.totalSeries,
    Singles: overview?.totalSingle,
  };

  return (
    <div className="space-y-5">
      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#87102C] via-[#6e0c24] to-[#3d0512] px-6 py-8 sm:px-10 sm:py-10">
        {/* grain texture */}
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-30" />
        {/* ambient orbs */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-black/25 blur-3xl" />
        <div className="pointer-events-none absolute right-1/3 top-0 h-40 w-40 rounded-full bg-rose-400/10 blur-2xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          {/* Left copy */}
          <div>
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 backdrop-blur-sm">
              <Sparkles size={11} className="text-church-accent" />
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">
                Sermon Management
              </span>
            </div>

            <h1 className="font-serif text-4xl font-bold italic leading-[1.1] text-white drop-shadow-sm sm:text-5xl lg:text-[3.25rem]">
              Sermons
            </h1>

            <p className="font-sans mt-2.5 max-w-sm text-sm leading-relaxed text-white/55">
              Publish, organise and share your church messages with your congregation.
            </p>

            {/* Quick-stat pills */}
            {!isLoading && overview && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="font-sans inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  {overview.totalPublished} Published
                </span>

                {overview.totalDrafted > 0 && (
                  <span className="font-sans inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {overview.totalDrafted} Draft{overview.totalDrafted !== 1 ? 's' : ''}
                  </span>
                )}

                <span className="font-sans inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-sm">
                  <BookOpen size={10} className="text-white/50" />
                  {overview.totalSermons} Total
                </span>
              </div>
            )}

            {isLoading && (
              <div className="mt-5 flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-full bg-white/15" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-white/15" />
                <div className="h-6 w-14 animate-pulse rounded-full bg-white/15" />
              </div>
            )}
          </div>

          {/* CTA — navigate to new sermon page */}
          <button
            type="button"
            onClick={() => router.push('/dashboard/sermons/new')}
            className="font-sans inline-flex w-fit items-center gap-2 self-start rounded-xl
              bg-white px-5 py-3 text-sm font-bold text-[#87102C]
              shadow-lg shadow-black/25
              hover:bg-church-warm active:scale-[0.97]
              transition-all duration-150 whitespace-nowrap sm:self-end"
          >
            <Plus size={16} strokeWidth={2.5} />
            New Sermon
          </button>
        </div>
      </div>

      {/* ── Empty state ────────────────────────────────────────────── */}
      {!isLoading && overview?.totalSermons === 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#87102C]/25 bg-[#87102C]/[0.04] px-5 py-4">
          <Sparkles size={14} className="shrink-0 text-[#87102C] dark:text-[#e8768a]" />
          <p className="font-sans text-sm text-[#87102C]/75 dark:text-[#e8768a]/75">
            No sermons yet — hit{' '}
            <button
              type="button"
              onClick={() => router.push('/dashboard/sermons/new')}
              className="font-bold text-[#87102C] dark:text-[#e8768a] underline-offset-2 hover:underline"
            >
              New Sermon
            </button>{' '}
            to publish your first message.
          </p>
        </div>
      )}

      {/* ── Stat cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map((stat: any) => (
          <StatCard
            key={stat.label}
            {...stat}
            value={values[stat.label]}
            loading={isLoading}
          />
        ))}
      </div>
    </div>
  );
}
