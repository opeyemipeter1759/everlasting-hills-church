import { Bell, ChevronRight, Clock } from "lucide-react";
import { SectionCard } from "@/components/ui/cards/SectionCard";

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

export function AnnouncementsPanel({
  announcements = [],
  loading = false,
}: {
  announcements?: Announcement[];
  loading?: boolean;
}) {
  return (
    <SectionCard
      title="Community Announcements"
      iconEl={<Bell size={14} />}
      action={
        <span className="text-xs text-[#87102C] dark:text-[#e8768a] font-medium flex items-center gap-1 cursor-default">
          {announcements.length > 0 ? `${announcements.length} total` : "All Announcements"} <ChevronRight size={12} />
        </span>
      }
    >
      {loading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-white/10" />
              <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-white/5" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
            <Bell size={18} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No announcements yet</p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
            Church announcements will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.slice(0, 5).map((a, i) => (
            <div
              key={a.id}
              className={`pb-4 border-b border-gray-100 dark:border-white/8 last:border-0 last:pb-0 ${
                i === 0 ? "text-[#87102C] dark:text-[#e8768a]" : ""
              }`}
            >
              <p className="text-sm font-semibold text-[#111] dark:text-white leading-snug">{a.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">{a.body}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                <Clock size={9} className="flex-shrink-0" />
                {relativeTime(a.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="pt-3 border-t border-gray-100 dark:border-white/8 mt-2">
        <p className="text-[10px] text-gray-300 dark:text-gray-600">
          Everlasting Hills Communication Desk · Ibadan, NG
        </p>
      </div>
    </SectionCard>
  );
}
