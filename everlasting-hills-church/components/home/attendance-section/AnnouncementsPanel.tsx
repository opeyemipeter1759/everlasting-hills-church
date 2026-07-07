"use client";

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BellRing, CheckCircle2 } from "lucide-react";
import { useUnseenAnnouncements, type Announcement } from "@/hooks";
import PanelHeader from "./PanelHeader";
import AnnouncementItem from "./AnnouncementItem";
import { dateBucketOf, type DateBucket } from "./utils";

interface AnnouncementsPanelProps {
  announcements: Announcement[];
  loading: boolean;
}

export default function AnnouncementsPanel({ announcements, loading }: AnnouncementsPanelProps) {
  const { unseenCount, isUnseen, markSeen } = useUnseenAnnouncements(
    announcements.map((a) => a.createdAt)
  );

  useEffect(() => {
    if (announcements.length === 0) return;
    const timer = setTimeout(markSeen, 2500);
    return () => clearTimeout(timer);
  }, [announcements.length, markSeen]);

  const groups = useMemo(() => groupByBucket(announcements), [announcements]);

  return (
    <motion.div
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.02]"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.12 }}
    >
      <PanelHeader
        icon={BellRing}
        eyebrow="From the Church"
        title="Announcements"
        badge={
          announcements.length > 0 ? (
            <span className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-[#FFB3C1]">
              {unseenCount > 0 && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FFB3C1]" />}
              {unseenCount > 0 ? `${unseenCount} new` : `${announcements.length} total`}
            </span>
          ) : undefined
        }
      />

      {loading && announcements.length === 0 ? (
        <SkeletonRows />
      ) : announcements.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="max-h-[380px] flex-1 space-y-5 overflow-y-auto px-4 py-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
          {groups.map(([bucket, items]) => (
            <div key={bucket}>
              <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{bucket}</p>
              <div className="space-y-2.5">
                {items.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <AnnouncementItem announcement={a} isNew={isUnseen(a.createdAt)} />
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function groupByBucket(announcements: Announcement[]): [DateBucket, Announcement[]][] {
  const order: DateBucket[] = ["Upcoming", "Today", "This Week", "Past"];
  const map = new Map<DateBucket, Announcement[]>();
  for (const a of announcements) {
    const bucket = dateBucketOf(a.createdAt);
    if (!map.has(bucket)) map.set(bucket, []);
    map.get(bucket)!.push(a);
  }
  return order.filter((b) => map.has(b)).map((b) => [b, map.get(b)!]);
}

function SkeletonRows() {
  return (
    <div className="flex-1 space-y-3 px-4 py-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex gap-3">
            <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded bg-white/10" />
              <div className="h-2.5 w-full rounded bg-white/[0.06]" />
              <div className="h-2.5 w-4/5 rounded bg-white/[0.06]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/8">
        <CheckCircle2 size={20} className="text-[#FFB3C1]/70" />
      </span>
      <div>
        <p className="text-sm font-bold text-white">You&apos;re all caught up</p>
        <p className="mt-1 max-w-[220px] text-xs text-white/45">
          No announcements right now — check back after service.
        </p>
      </div>
    </div>
  );
}
