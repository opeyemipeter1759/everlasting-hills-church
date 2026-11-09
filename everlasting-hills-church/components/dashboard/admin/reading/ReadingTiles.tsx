import { BookOpen, CheckCircle2, CircleDashed, Flame, Moon, Sparkles, type LucideIcon } from "lucide-react";
import type { ReadingMonitorData } from "@/lib/api/admin-reading";
import { plural, TONE, type Filter } from "./shared";

interface Tile {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: keyof typeof TONE;
  /** The group of people this number is about, shown when the tile is pressed. */
  filter: Filter;
}

function tilesFor(stats: ReadingMonitorData["stats"], finishedSomething: number): Tile[] {
  return [
    { label: "Reading", value: stats.reading, detail: `of ${stats.activeMembers} members read in the last 7 days`, icon: BookOpen, tone: "brand", filter: "READING" },
    { label: "Days read this week", value: stats.readingsThisWeek, detail: `by the ${plural(stats.reading, "person", "people")} reading`, icon: Flame, tone: "plain", filter: "READING" },
    { label: "Just started", value: stats.justStarted ?? 0, detail: "Began a plan this week, nothing read yet", icon: Sparkles, tone: "plain", filter: "NEW" },
    { label: "Gone quiet", value: stats.quiet, detail: "A plan over a week old, nothing read in 7 days", icon: Moon, tone: stats.quiet ? "warn" : "plain", filter: "QUIET" },
    { label: "No plan", value: stats.notStarted, detail: "Not on any plan right now", icon: CircleDashed, tone: "plain", filter: "NOT_STARTED" },
    { label: "Plans finished", value: stats.plansCompleted, detail: `by ${plural(finishedSomething, "member")}`, icon: CheckCircle2, tone: "good", filter: "HAS_FINISHED" },
  ];
}

/** Six numbers at a glance; each is a button that shows the people behind it. */
export default function ReadingTiles({ stats, finishedSomething, filter, onSelect }: {
  stats: ReadingMonitorData["stats"] | undefined;
  finishedSomething: number;
  filter: Filter;
  onSelect: (filter: Filter) => void;
}) {
  const tiles = stats ? tilesFor(stats, finishedSomething) : [];
  return (
    <div role="group" aria-label="Reading at a glance" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const selected = filter === tile.filter;
        return (
          <button
            key={tile.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(tile.filter)}
            className={`min-w-0 rounded-2xl border p-4 text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C] dark:focus-visible:ring-[#FFB3C1] ${TONE[tile.tone]} ${selected ? "ring-2 ring-[#87102C]/50 dark:ring-[#FFB3C1]/50" : ""}`}
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-white/65">
              <Icon size={14} aria-hidden="true" className="shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
              {tile.label}
            </span>
            <span className="mt-1.5 block text-2xl font-black tabular-nums text-[#111] dark:text-white">{tile.value}</span>
            <span className="mt-0.5 block text-[11px] leading-snug text-gray-500 dark:text-white/45">{tile.detail}</span>
          </button>
        );
      })}
    </div>
  );
}
