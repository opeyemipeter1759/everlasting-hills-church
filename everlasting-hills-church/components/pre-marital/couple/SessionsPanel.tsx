import type { CoupleSession } from "@/lib/api/couple";
import { button, clock, longDay, muted, Panel } from "./parts";

function SessionItem({ s }: { s: CoupleSession }) {
  const cancelled = s.status === "CANCELLED";
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <p className={`font-semibold ${cancelled ? `line-through ${muted}` : "text-[#111] dark:text-white"}`}>{longDay(s.scheduledAt)}</p>
      <p className={`text-sm ${muted}`}>
        {clock(s.scheduledAt)}, {s.durationMinutes} minutes, {s.format === "ONLINE" ? "online" : s.location ? `at ${s.location}` : "in person"}
      </p>
      {s.topic && <p className="mt-0.5 text-sm text-[#111] dark:text-white/85">Topic: {s.topic}</p>}
      {s.counsellor && <p className={`text-sm ${muted}`}>With {s.counsellor}</p>}
      {cancelled && <p className="mt-0.5 text-sm text-red-700 dark:text-red-300">Cancelled. Your counsellor will find another time with you.</p>}
      {s.meetingLink && (
        <a href={s.meetingLink} target="_blank" rel="noopener noreferrer" className={`${button} mt-2`}>
          Join the online session
        </a>
      )}
    </li>
  );
}

/** Upcoming sessions first; past ones below, quieter. All times are Lagos time. */
export function SessionsPanel({ sessions }: { sessions: CoupleSession[] }) {
  const now = Date.now();
  const upcoming = sessions.filter((s) => s.status !== "COMPLETED" && new Date(s.scheduledAt).getTime() >= now - 2 * 3_600_000);
  const past = sessions.filter((s) => !upcoming.includes(s)).reverse();
  return (
    <Panel id="pmc-sessions" title="Your sessions" aside={<span className={`text-xs ${muted}`}>Times are Lagos time</span>}>
      {upcoming.length === 0 ? (
        <p className={`text-sm ${muted}`}>No session is booked yet. Your counsellor will arrange the next one with you.</p>
      ) : (
        <ul className="divide-y divide-[#E7CDD3]/60 dark:divide-white/10">
          {upcoming.map((s) => (
            <SessionItem key={s.id} s={s} />
          ))}
        </ul>
      )}
      {past.length > 0 && (
        <details className="mt-4 rounded-xl bg-[#FFF8F9] p-3 dark:bg-white/[0.03]">
          <summary className="cursor-pointer text-sm font-semibold text-[#111] dark:text-white">
            Past sessions ({past.length})
          </summary>
          <ul className="mt-2 divide-y divide-[#E7CDD3]/60 dark:divide-white/10">
            {past.map((s) => (
              <SessionItem key={s.id} s={s} />
            ))}
          </ul>
        </details>
      )}
    </Panel>
  );
}
