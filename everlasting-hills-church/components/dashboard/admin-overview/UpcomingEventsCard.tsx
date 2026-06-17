import { CalendarDays } from "lucide-react";
import DashboardCard, { type DashboardCardChrome } from "./DashboardCard";
import type { UpcomingEvent } from "@/lib/mock/admin-dashboard.mock";

export default function UpcomingEventsCard({
  events,
  ...chrome
}: { events: UpcomingEvent[] } & DashboardCardChrome) {
  return (
    <DashboardCard kicker="Calendar" title="Upcoming Events" icon={CalendarDays} {...chrome}>
      {events.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#8a7e80] dark:text-white/40">No events scheduled.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="flex items-center gap-3 rounded-xl border border-[#E7CDD3]/50 bg-[#FFF4F6]/50 px-4 py-3 dark:border-white/[0.07] dark:bg-white/[0.03]"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFE8ED] dark:bg-[#87102C]/25">
                <CalendarDays size={16} className="text-[#87102C] dark:text-[#FFB3C1]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#111] dark:text-white">{ev.title}</p>
                <p className="text-xs text-[#8a7e80] dark:text-white/45">{ev.when}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
