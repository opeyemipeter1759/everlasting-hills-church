"use client";

import { CalendarClock, ExternalLink, Radio } from "lucide-react";
import { useGatherings, type Gathering } from "@/lib/api/gatherings";
import {
  formatLeadTime,
  formatOccurrenceDay,
  formatOccurrenceTime,
  formatTimeRemaining,
} from "@/lib/gatherings/countdown";
import { orderGatherings } from "@/lib/gatherings/ordering";
import { describeSchedule } from "@/lib/gatherings/recurrence";
import { iconBg, iconCl, muted } from "./tokens";
import { PanelCard } from "./Primitives";

/**
 * The member's view of recurring gatherings — the daily prayer call and
 * anything shaped like it.
 *
 * Self-contained rather than fed from the dashboard loader: `isLive` and
 * `nextOccurrenceAt` are computed per request and go stale within the minute,
 * so they need the polling client query, not a value rendered once on the
 * server. That also keeps a slow or failing gatherings endpoint from delaying
 * the rest of the dashboard.
 *
 * Renders nothing at all when there is nothing to show — while loading, on
 * error, or when the church has no active gatherings. An empty panel would
 * take a slot on the member's home page to say nothing, and a failed poll is
 * not something a member can act on.
 */
export function GatheringsPanel() {
  const { data: gatherings = [], isError } = useGatherings();
  if (isError || gatherings.length === 0) return null;

  const ordered = orderGatherings(gatherings);

  const liveCount = ordered.filter((g) => g.isLive).length;

  return (
    <PanelCard
      kicker="Gather"
      title="Gatherings"
      icon={CalendarClock}
      action={
        liveCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 shrink-0">
            <Radio size={9} className="animate-pulse" /> {liveCount} live
          </span>
        ) : undefined
      }
    >
      <div className="space-y-1">
        {ordered.map((gathering) => (
          <GatheringRow key={gathering.id} gathering={gathering} />
        ))}
      </div>
    </PanelCard>
  );
}

function GatheringRow({ gathering }: { gathering: Gathering }) {
  return (
    <div className="flex gap-3 rounded-xl p-2 -mx-2">
      <span className={`${iconBg} !h-10 !w-10`}>
        {gathering.isLive ? (
          <Radio size={15} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
        ) : (
          <CalendarClock size={15} className={iconCl} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-xs font-semibold text-[#111] dark:text-white line-clamp-1">
            {gathering.title}
          </p>
          {gathering.isLive && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Live now
            </span>
          )}
        </div>

        <p className={`text-[10px] ${muted} mt-0.5`}>
          <GatheringTiming gathering={gathering} />
        </p>
      </div>

      {/* A join link only helps while there is something to join. */}
      {gathering.joinUrl && gathering.isLive && (
        <a
          href={gathering.joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-center inline-flex items-center gap-1 rounded-xl bg-[#87102C] px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-[#6E0C24] shrink-0"
        >
          Join <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}

/**
 * The one line under the title. While live it counts down what is left;
 * otherwise it names the next occurrence, falling back to the recurrence
 * itself when the server has no next occurrence to give.
 */
function GatheringTiming({ gathering }: { gathering: Gathering }) {
  if (gathering.isLive && gathering.endsAt) {
    const remaining = formatTimeRemaining(gathering.endsAt);
    return <>{remaining ? `In progress · ${remaining}` : "In progress"}</>;
  }

  if (!gathering.nextOccurrenceAt) {
    return (
      <>
        {describeSchedule(
          gathering.recurrenceRule,
          gathering.startTime,
          gathering.durationMinutes,
          gathering.startDate,
        )}
      </>
    );
  }

  const day = formatOccurrenceDay(gathering.nextOccurrenceAt, gathering.timezone);
  const time = formatOccurrenceTime(gathering.nextOccurrenceAt, gathering.timezone);
  const lead = formatLeadTime(gathering.nextOccurrenceAt);

  return (
    <>
      {day} · {time} · {lead}
    </>
  );
}
