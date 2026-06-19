import { Sparkles } from "lucide-react";
import { SectionCard } from "@/components/ui/cards/SectionCard";
import { relativeTime } from "@/utils/ServiceUtils";
import type { MemberHomeProps } from "@/types";

export function ActivityFeed({ services, prayerCount }: {
  services: MemberHomeProps["recentServices"];
  prayerCount: number;
}) {
  const items = [
    ...services.map((s) => ({
      time: relativeTime(s.scheduledAt),
      text: `${s.totalAttended} member${s.totalAttended !== 1 ? "s" : ""} attended ${s.name}`,
      date: s.scheduledAt,
    })),
  ];

  if (prayerCount > 0) {
    items.push({
      time: "On record",
      text: `${prayerCount} prayer request${prayerCount !== 1 ? "s" : ""} submitted to the church`,
      date: new Date().toISOString(),
    });
  }

  return (
    <SectionCard title="Recent Platform Actions" iconEl={<Sparkles size={14} />}>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles size={24} className="text-gray-200 dark:text-gray-700 mb-2" />
          <p className="text-sm text-gray-400 dark:text-gray-500">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#87102C] mt-1" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-0.5">
                  {item.time}
                </p>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/8">
        <p className="text-[10px] text-gray-300 dark:text-gray-600">
          Ibadan Diocese Council Oversight Group
        </p>
      </div>
    </SectionCard>
  );
}
