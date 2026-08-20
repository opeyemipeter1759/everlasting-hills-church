"use client";

import { Clock, ExternalLink, Pause, Pencil, Play, Radio, Trash2 } from "lucide-react";
import type { Gathering } from "@/lib/api/gatherings";
import { formatLeadTime, formatOccurrenceDay, formatOccurrenceTime } from "@/lib/gatherings/countdown";
import { describeSchedule } from "@/lib/gatherings/recurrence";

export default function GatheringCard({
  gathering,
  onEdit,
  onDelete,
  onToggleActive,
  busy,
}: {
  gathering: Gathering;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  busy: boolean;
}) {
  const schedule = describeSchedule(
    gathering.recurrenceRule,
    gathering.startTime,
    gathering.durationMinutes,
    gathering.startDate,
  );

  return (
    <div
      className={`group flex gap-4 rounded-2xl border p-4 sm:p-5 transition-all ${
        gathering.isActive
          ? "border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm"
          : "border-gray-200/60 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02]"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={`font-semibold truncate ${
                  gathering.isActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-white/40"
                }`}
              >
                {gathering.title}
              </p>
              {gathering.isLive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <Radio size={9} className="animate-pulse" /> Live
                </span>
              )}
              {!gathering.isActive && (
                <span className="rounded-full bg-gray-100 dark:bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">
                  Paused
                </span>
              )}
            </div>

            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/50">
              <Clock size={13} className="shrink-0" />
              {schedule}
            </p>

            {gathering.description && (
              <p className="mt-1.5 text-sm text-gray-400 dark:text-white/35 line-clamp-2">
                {gathering.description}
              </p>
            )}
          </div>

          <NextOccurrence gathering={gathering} />
        </div>

        <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-white/30 min-w-0">
            <span className="truncate">{gathering.timezone}</span>
            {gathering.joinUrl && (
              <a
                href={gathering.joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors truncate"
              >
                <ExternalLink size={11} className="shrink-0" /> Join link
              </a>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onToggleActive}
              disabled={busy}
              title={gathering.isActive ? "Pause — hide from members" : "Resume"}
              aria-label={gathering.isActive ? "Pause gathering" : "Resume gathering"}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              {gathering.isActive ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              type="button"
              onClick={onEdit}
              title="Edit"
              aria-label="Edit gathering"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete"
              aria-label="Delete gathering"
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The right-hand "when next" block.
 *
 * A paused gathering deliberately shows nothing: the server still computes a
 * next occurrence for it, but advertising a time for something members cannot
 * see would misrepresent what is scheduled.
 */
function NextOccurrence({ gathering }: { gathering: Gathering }) {
  if (!gathering.isActive || !gathering.nextOccurrenceAt) {
    return (
      <span className="text-[11px] text-gray-300 dark:text-white/20 shrink-0 text-right">
        {gathering.isActive ? "Not scheduled" : "—"}
      </span>
    );
  }

  return (
    <div className="shrink-0 text-right">
      <p className="text-[11px] font-semibold text-gray-500 dark:text-white/40">
        {formatOccurrenceDay(gathering.nextOccurrenceAt, gathering.timezone)}
      </p>
      <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
        {formatOccurrenceTime(gathering.nextOccurrenceAt, gathering.timezone)}
      </p>
      <p className="text-[11px] text-gray-400 dark:text-white/30">
        {formatLeadTime(gathering.nextOccurrenceAt)}
      </p>
    </div>
  );
}
