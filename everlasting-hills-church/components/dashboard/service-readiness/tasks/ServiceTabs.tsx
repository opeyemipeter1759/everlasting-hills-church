import type { ReadinessServiceRef } from "@/lib/api/service-readiness-plans";

type Tab = Pick<ReadinessServiceRef, "id" | "serviceType" | "scheduledAt">;

/** "11 Nov" for a service day stored as the start of its Lagos day. */
const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });

/** Pick a coming service: the day in large type, its date underneath. */
export default function ServiceTabs({ services, selectedId, onSelect }: { services: Tab[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div role="tablist" aria-label="Service" className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1 dark:bg-white/[0.05] sm:inline-grid sm:min-w-[360px]">
      {services.map((s) => {
        const on = s.id === selectedId;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(s.id)}
            className={`rounded-xl px-4 py-2 text-left transition-all ${
              on ? "bg-white shadow-sm dark:bg-white/10" : "hover:bg-white/60 dark:hover:bg-white/[0.04]"
            }`}
          >
            <span className={`block text-sm font-black ${on ? "text-[#87102C] dark:text-[#FFB3C1]" : "text-gray-600 dark:text-white/60"}`}>
              {s.serviceType === "SUNDAY" ? "Sunday" : "Wednesday"}
            </span>
            <span className="block text-xs text-gray-500 dark:text-white/45">{dateOf(s.scheduledAt)}</span>
          </button>
        );
      })}
    </div>
  );
}
