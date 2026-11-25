import type { EventSchedule, EventSection } from "@/types";

export const inputCls =
  "w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600";

/** ISO → value for <input type="datetime-local"> in the admin's local timezone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatRange(startIso: string, endIso: string | null): string {
  const s = new Date(startIso);
  if (Number.isNaN(s.getTime())) return "";
  const dateStr = s.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = s.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dateStr} · ${time}`;
}

/** Trimmed text, or null when empty — so editing can clear an optional field. */
const text = (v: string) => (v.trim() ? v.trim() : null);

export function schedulesPayload(schedules: EventSchedule[]) {
  return schedules.map((schedule, index) => ({
    title: schedule.title.trim(),
    description: text(schedule.description ?? ""),
    startTime: schedule.startTime,
    endTime: text(schedule.endTime ?? ""),
    recurrenceRule: text(schedule.recurrenceRule ?? ""),
    meetingUrl: text(schedule.meetingUrl ?? ""),
    sortOrder: index,
  }));
}

export function sectionsPayload(sections: EventSection[]) {
  return sections.map((section, index) => ({
    type: section.type,
    title: text(section.title ?? ""),
    subtitle: text(section.subtitle ?? ""),
    content: section.content,
    sortOrder: index,
    isVisible: section.isVisible,
  }));
}
