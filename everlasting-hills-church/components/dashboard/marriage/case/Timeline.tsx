import type { CaseDetail } from "@/lib/api/premarital";
import { STATUS_LABEL } from "@/lib/pre-marital/schema";
import { card, lagosDateTime } from "../ui";

/** Every status change, oldest first, with who made it. */
export function Timeline({ c }: { c: CaseDetail }) {
  return (
    <section aria-labelledby="timeline-heading" className={card}>
      <h2 id="timeline-heading" className="text-base font-bold text-[#111] dark:text-white">History</h2>
      <ol className="mt-3 space-y-3 border-l-2 border-gray-200 pl-4 dark:border-white/10">
        {c.timeline.map((e) => (
          <li key={e.id}>
            <p className="text-sm font-semibold text-[#111] dark:text-white">{e.from ? STATUS_LABEL[e.to] : "Application received"}</p>
            <p className="text-xs text-gray-600 dark:text-white/55">
              {lagosDateTime(e.at)}
              {e.by ? ` · ${e.by}` : ""}
            </p>
            {e.reason && <p className="mt-1 text-sm text-gray-700 dark:text-white/75">{e.reason}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
