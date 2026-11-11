import type { ReadinessUpdate } from "@/lib/api/service-readiness-plans";
import { lagosWhen } from "./when";

/** A unit's updates on its plan, oldest first: each "ready" or "blocker", who posted it and when. */
export default function UpdatesTimeline({ updates }: { updates: ReadinessUpdate[] }) {
  if (!updates.length) return null;
  return (
    <ol className="grid gap-2 border-l-2 border-gray-100 pl-3 text-sm dark:border-white/10" aria-label="Updates">
      {updates.map((u) => (
        <li key={u.createdAt}>
          <p className={`text-xs font-bold ${u.status === "BLOCKED" ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
            {u.status === "BLOCKED" ? "Blocker" : "Everything ready"}
            <span className="font-normal text-gray-500 dark:text-white/45"> · {u.by ?? "Someone"} · {lagosWhen(u.createdAt)}</span>
          </p>
          {u.note && <p className="whitespace-pre-wrap break-words text-gray-800 dark:text-white/80">{u.note}</p>}
        </li>
      ))}
    </ol>
  );
}
