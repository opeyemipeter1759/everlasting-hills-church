import { Bell, ChevronRight } from "lucide-react";
import { SectionCard } from "@/components/ui/cards/SectionCard";

export function AnnouncementsPanel() {
  return (
    <SectionCard
      title="Community Announcements"
      iconEl={<Bell size={14} />}
      action={
        <span className="text-xs text-[#87102C] dark:text-[#e8768a] font-medium flex items-center gap-1 cursor-default">
          All Announcements <ChevronRight size={12} />
        </span>
      }
    >
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
          <Bell size={18} className="text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">No announcements yet</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">
          Church announcements will appear here
        </p>
      </div>
      <div className="pt-3 border-t border-gray-100 dark:border-white/8 mt-2">
        <p className="text-[10px] text-gray-300 dark:text-gray-600">
          Everlasting Hills Communication Desk · Ibadan, NG
        </p>
      </div>
    </SectionCard>
  );
}
