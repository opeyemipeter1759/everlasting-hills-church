'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SermonWatchPanel from './watch/SermonWatchPanel';
import type { MemberSermonContext, WatchSermon } from '@/lib/api/sermon-types';

export default function SermonDetail({
  sermon,
  memberCtx,
  isLoggedIn,
}: {
  sermon: WatchSermon;
  memberCtx: MemberSermonContext | null;
  isLoggedIn: boolean;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111]">
      <div className="border-b border-gray-200 dark:border-white/8 bg-white dark:bg-[#1c1c1e]">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <Link
            href="/sermons"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ArrowLeft size={14} /> All Sermons
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <SermonWatchPanel sermon={sermon} memberCtx={memberCtx} isLoggedIn={isLoggedIn} />
      </div>
    </div>
  );
}
