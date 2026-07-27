"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellRing, ChevronDown, Clock } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "Last week";
  return `${weeks} weeks ago`;
}

function AnnouncementRow({ a, isNewest, isLast, index }: { a: Announcement; isNewest: boolean; isLast: boolean; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const clampable = a.body.length > 140;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ x: 2 }}
      className={`flex gap-4 px-5 py-4 transition-colors ${isNewest ? "bg-[#FFF4F6] dark:bg-[#87102C]/10" : "hover:bg-gray-50/60 dark:hover:bg-white/[0.02]"}`}
    >
      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 pt-1">
        <motion.span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${isNewest ? "bg-[#87102C] dark:bg-[#FFB3C1]" : "bg-[#E7CDD3] dark:bg-white/20"}`}
          animate={isNewest ? { scale: [1, 1.4, 1], boxShadow: ["0 0 0 0 rgba(135,16,44,0.35)", "0 0 0 4px rgba(135,16,44,0)", "0 0 0 0 rgba(135,16,44,0)"] } : undefined}
          transition={isNewest ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
        />
        {!isLast && <div className="w-px flex-1 bg-[#E7CDD3]/60 dark:bg-white/[0.07] min-h-[16px]" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[13px] font-bold leading-snug ${isNewest ? "text-[#87102C] dark:text-[#FFB3C1]" : "text-[#111] dark:text-white"}`}>
            {a.title}
          </p>
          {isNewest && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 15 }}
              className="flex-shrink-0 text-[9px] font-bold uppercase tracking-[0.18em] text-[#87102C] dark:text-[#FFB3C1] bg-[#FFE8ED] dark:bg-[#87102C]/25 px-2 py-0.5 rounded-full mt-0.5"
            >
              New
            </motion.span>
          )}
        </div>

        <motion.p
          layout="position"
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}
        >
          {a.body}
        </motion.p>

        {clampable && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-bold text-[#87102C] dark:text-[#e8768a] hover:underline"
          >
            {expanded ? "Show less" : "Read more"}
            <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown size={11} />
            </motion.span>
          </button>
        )}

        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
          <Clock size={9} className="flex-shrink-0" />
          {relativeTime(a.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

export function AnnouncementsPanel({
  announcements = [],
  loading = false,
}: {
  announcements?: Announcement[];
  loading?: boolean;
}) {
  const shown = announcements.slice(0, 5);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/[0.09] bg-white dark:bg-white/[0.05] overflow-hidden shadow-[0_1px_3px_rgba(135,16,44,0.04)] dark:shadow-none"
    >
      {/* Gradient header */}
      <div
        className="px-5 py-4 flex items-center justify-between gap-3"
        style={{ background: "linear-gradient(135deg, #2a0410 0%, #4a0819 50%, #87102C 100%)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <motion.span
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 border border-white/20"
            animate={{ rotate: [0, -12, 10, -8, 6, 0] }}
            transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
          >
            <BellRing size={15} className="text-[#FFB3C1]" aria-hidden="true" />
          </motion.span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FFB3C1]/70">From the Church</p>
            <h3 className="text-sm font-bold text-white truncate">Announcements</h3>
          </div>
        </div>
        {!loading && announcements.length > 0 && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 250, damping: 18 }}
            className="flex-shrink-0 text-[10px] font-bold text-[#FFB3C1] bg-white/10 border border-white/15 px-2.5 py-1 rounded-full"
          >
            {announcements.length} {announcements.length === 1 ? "update" : "updates"}
          </motion.span>
        )}
      </div>

      {loading ? (
        <div className="p-5 space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-white/10" />
              <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-white/5" />
              <div className="h-2.5 w-4/5 rounded bg-gray-100 dark:bg-white/5" />
            </div>
          ))}
        </div>
      ) : shown.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center py-10 text-center px-5"
        >
          <div className="w-11 h-11 rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/15 flex items-center justify-center mb-3">
            <Bell size={18} className="text-[#87102C]/50 dark:text-[#e8768a]/50" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">No announcements yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Church announcements will appear here</p>
        </motion.div>
      ) : (
        <div className="divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.06]">
          {shown.map((a, i) => (
            <AnnouncementRow key={a.id} a={a} isNewest={i === 0} isLast={i === shown.length - 1} index={i} />
          ))}
        </div>
      )}

      <div className="px-5 py-3 border-t border-[#E7CDD3]/40 dark:border-white/[0.06] bg-[#FFF4F6]/40 dark:bg-white/[0.02]">
        <p className="text-[10px] text-gray-400 dark:text-gray-500">
          Everlasting Hills Communication Desk · Ibadan, NG
        </p>
      </div>
    </motion.section>
  );
}
