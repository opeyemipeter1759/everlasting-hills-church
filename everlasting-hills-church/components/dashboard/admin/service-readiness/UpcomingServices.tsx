import { CalendarClock } from "lucide-react";
import type { UpcomingReadinessService } from "@/lib/api/service-readiness";
import { lagosTime, lagosWhen } from "./when";

/** The next Sunday and Wednesday, with the manual's two deadlines and how many departments serve. */
export default function UpcomingServices({ services }: { services: UpcomingReadinessService[] }) {
  if (services.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
        No Sunday or Wednesday service is scheduled yet.
      </p>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((s) => (
        <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#87102C] dark:text-[#FFB3C1]">
            <CalendarClock size={14} aria-hidden="true" />
            {s.serviceType === "SUNDAY" ? "Sunday" : "Wednesday"}
          </p>
          <p className="mt-1 text-sm font-bold text-[#111] dark:text-white">{s.name}</p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <dt className="text-gray-500 dark:text-white/45">Plans due</dt>
              <dd className="font-semibold tabular-nums text-[#111] dark:text-white">{lagosWhen(s.planDue)}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-white/45">Ready by</dt>
              <dd className="font-semibold tabular-nums text-[#111] dark:text-white">{lagosTime(s.readyBy)}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-white/45">Units</dt>
              <dd className="font-semibold tabular-nums text-[#111] dark:text-white">{s.departmentsServing}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  );
}
