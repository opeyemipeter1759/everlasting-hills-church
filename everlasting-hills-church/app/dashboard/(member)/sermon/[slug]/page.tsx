'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, BookOpen, Clock, Headphones, Heart, MessageCircle, Layers, Mic2,
} from 'lucide-react';
import { useSermonBySlug, useSermonMemberContext } from '@/lib/api';
import { toWatchSermon, formatSermonDuration } from '@/lib/api/sermon-types';
import type { WatchSermon } from '@/lib/api/sermon-types';
import SermonWatchPanel from '@/components/sermons/watch/SermonWatchPanel';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
        <Icon size={12} />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-lg font-black text-gray-900 dark:text-white leading-tight mt-0.5">{value}</p>
    </div>
  );
}

/** Sidebar card — puts the extra width freed up on a wide dashboard screen to good use. */
function SermonInfoCard({ sermon }: { sermon: WatchSermon }) {
  const duration = formatSermonDuration(sermon.audioDuration);
  const isSeries = sermon.type === 'SERIES' || !!sermon.series;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] overflow-hidden">
      <div className="relative aspect-video bg-gray-100 dark:bg-white/5">
        {sermon.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={sermon.thumbnailUrl} alt={sermon.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#87102C]/10 to-[#87102C]/5 dark:from-[#87102C]/20 dark:to-transparent flex items-center justify-center">
            <BookOpen size={28} className="text-[#87102C]/30 dark:text-[#87102C]/40" />
          </div>
        )}
        <span
          className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ${
            isSeries ? 'bg-[#87102C]/85 text-white' : 'bg-black/60 text-white'
          }`}
        >
          {isSeries ? <Layers size={10} /> : <Mic2 size={10} />}
          {isSeries ? 'Series' : 'Single'}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          {sermon.series && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a] mb-1">
              {sermon.series}
            </p>
          )}
          <h3 className="font-black text-sm text-gray-900 dark:text-white leading-snug">{sermon.title}</h3>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p className="font-semibold text-gray-700 dark:text-gray-300">{sermon.speaker}</p>
          <p>{fmtDate(sermon.date)}</p>
          {sermon.scriptureRef && (
            <p className="font-semibold text-[#87102C] dark:text-[#e8768a]">{sermon.scriptureRef}</p>
          )}
        </div>

        {sermon.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sermon.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Stat icon={Clock} label="Duration" value={duration || '—'} />
          <Stat icon={Headphones} label="Plays" value={sermon.playCount} />
          <Stat icon={Heart} label="Reactions" value={sermon._count.reactions} />
          <Stat icon={MessageCircle} label="Comments" value={sermon._count.comments} />
        </div>
      </div>
    </div>
  );
}

/**
 * Full sermon detail for a signed-in member — reached by clicking "View Details" on a
 * sermon card. Reuses the same SermonWatchPanel as the public /sermons/[slug] page (media,
 * reactions, comments, notes, reflection Q&A, and direct notes/questions to another member)
 * so playback still hands off to the one global player bar instead of embedding its own.
 */
export default function MemberSermonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: raw, isLoading, isError } = useSermonBySlug(slug);
  const { data: memberCtx } = useSermonMemberContext(raw?.id, true);
  const sermon = raw ? toWatchSermon(raw) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/sermon')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={14} /> My Sermons
        </button>
        {sermon && (
          <>
            <span className="text-gray-300 dark:text-gray-700">/</span>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 truncate">{sermon.title}</span>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={24} className="animate-spin text-[#87102C]" />
        </div>
      ) : isError || !sermon ? (
        <div className="flex flex-col items-center gap-2 py-24 text-center">
          <BookOpen size={24} className="text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">This sermon couldn't be found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-6 items-start">
          <SermonWatchPanel sermon={sermon} memberCtx={memberCtx ?? null} isLoggedIn />
          <aside className="lg:sticky lg:top-6">
            <SermonInfoCard sermon={sermon} />
          </aside>
        </div>
      )}
    </div>
  );
}
