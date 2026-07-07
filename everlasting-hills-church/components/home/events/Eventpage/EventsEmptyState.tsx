import { CalendarX } from "lucide-react";
import type { EventsTab } from "./EventsTabBar";

const COPY: Record<EventsTab, { title: string; body: string }> = {
  ongoing: {
    title: "Nothing happening right now",
    body: "No event is currently in progress — check the Upcoming tab for what's next.",
  },
  upcoming: {
    title: "No upcoming events yet",
    body: "Check back soon — new gatherings are added regularly.",
  },
  past: {
    title: "No past events on record",
    body: "Once events wrap up, they'll show up here.",
  },
};

export default function EventsEmptyState({ tab }: { tab: EventsTab }) {
  const { title, body } = COPY[tab];
  return (
    <div className="rounded-[28px] border border-[#E7CDD3] bg-[#FFF8F9] px-8 py-20 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
        <CalendarX size={22} className="text-[#87102C]" />
      </span>
      <p className="mt-5 text-lg font-bold text-[#111]">{title}</p>
      <p className="mt-2 text-sm text-[#777]">{body}</p>
    </div>
  );
}
