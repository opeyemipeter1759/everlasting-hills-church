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
      {/* ── Empty state ────────────────────────────────────────────── */}
      {!isLoading && overview?.totalSermons === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#87102C]/25 dark:border-[#e8768a]/20 bg-[#87102C]/[0.03] dark:bg-[#e8768a]/[0.03] px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#87102C]/10 dark:bg-[#e8768a]/10">
              <BookOpen size={19} className="text-[#87102C] dark:text-[#e8768a]" strokeWidth={2} />
            </div>
            <div>
              <p className="font-sans text-sm font-bold text-gray-900 dark:text-white">
                No sermons yet
              </p>
              <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Publish your first message so it appears here and on the public site.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => router.push('/dashboard/pastor/sermons/new')}
            className="font-sans inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#87102C] px-4 py-2 text-xs font-bold text-white hover:bg-[#6E0C24] active:scale-[0.97] transition-all"
          >
            <Plus size={13} strokeWidth={2.5} />
            New Sermon
          </button>
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
