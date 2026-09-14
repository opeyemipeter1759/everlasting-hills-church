"use client";

import { Fragment, useId, useMemo, useState } from "react";
import { CalendarCheck, Clock, Flame } from "lucide-react";
import { useReadingActivity, type ReadingActivity } from "@/lib/api/reading-plan";

/**
 * Reading effort: when somebody read, not only how far along a plan is.
 *
 * Twelve weeks as a calendar, one cell a day, shaded by how many readings were
 * completed that day across every plan. It is a sequential scale in the
 * church's wine: one hue, lightness rising with the count, and a first step
 * that clears the surface in both themes. Those properties were checked with
 * the dataviz validator in ordinal mode, not by eye. Colour never carries a
 * value alone: hovering or tapping a day reads it out, and a table lists every
 * day for screen readers.
 */

// Index is the day's readings, capped at 3. Dark mode flips the anchor so more
// reading is brighter against the dark card.
const LEVEL_CLASS = [
  "bg-[#F1E9E6] dark:bg-white/[0.07]",
  "bg-[#E08FA2] dark:bg-[#8A3346]",
  "bg-[#BE4863] dark:bg-[#C65E77]",
  "bg-[#87102C] dark:bg-[#FFB3C1]",
] as const;
const LEVEL_LABEL = ["No reading", "1 reading", "2 readings", "3 or more"] as const;
const levelOf = (readings: number) => Math.min(Math.max(readings, 0), 3);

const WEEKDAY_LABEL: Record<number, string> = { 1: "Mon", 3: "Wed", 5: "Fri" };
const DAY_MS = 86_400_000;
const utc = (date: string) => Date.parse(`${date}T00:00:00Z`);
const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const formatDate = (date: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-GB", { ...options, timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );

/** "45 min", "1 h", "2 h 5 min": the way a person would say it. */
export function formatMinutes(total: number) {
  if (total < 60) return `${total} min`;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

type Day = { date: string; readings: number; inWindow: boolean };

/** Weeks as columns and Sunday to Saturday as rows, padded to whole weeks. */
function calendarWeeks(activity: ReadingActivity): Day[][] {
  const counts = new Map(activity.days.map((day) => [day.date, day.readings]));
  const start = utc(activity.from);
  const end = utc(activity.today);
  const first = start - new Date(start).getUTCDay() * DAY_MS;
  const last = end + (6 - new Date(end).getUTCDay()) * DAY_MS;
  const weeks: Day[][] = [];
  for (let week = first; week <= last; week += 7 * DAY_MS) {
    weeks.push(
      Array.from({ length: 7 }, (_, offset) => {
        const ms = week + offset * DAY_MS;
        const date = isoDate(ms);
        return { date, readings: counts.get(date) ?? 0, inWindow: ms >= start && ms <= end };
      }),
    );
  }
  return weeks;
}

/**
 * A month name over the first week of each month. One is skipped when it would
 * sit in the column right after the last, where the two would collide.
 */
function monthLabels(weeks: Day[][]) {
  let lastLabelled = -2;
  let previousMonth = "";
  return weeks.map((week, index) => {
    const anchor = (week.find((day) => day.inWindow) ?? week[0]).date;
    const month = anchor.slice(0, 7);
    const changed = month !== previousMonth;
    previousMonth = month;
    if (!changed || index - lastLabelled < 2) return "";
    lastLabelled = index;
    return formatDate(anchor, { month: "short" });
  });
}

export function ReadingActivityView({ activity }: { activity: ReadingActivity }) {
  const titleId = useId();
  const weeks = useMemo(() => calendarWeeks(activity), [activity]);
  const labels = useMemo(() => monthLabels(weeks), [weeks]);
  const [selected, setSelected] = useState<Day | null>(null);
  const { totals } = activity;
  const windowDays = Math.round((utc(activity.today) - utc(activity.from)) / DAY_MS) + 1;
  const daysInWindow = activity.days.length;

  const readout = selected
    ? `${formatDate(selected.date, { weekday: "short", day: "numeric", month: "short" })}: ${
        selected.readings === 0
          ? "no reading"
          : `${selected.readings} reading${selected.readings === 1 ? "" : "s"}`
      }`
    : totals.readings === 0
      ? "Your first reading will light up this calendar."
      : `You read on ${daysInWindow} of the last ${windowDays} days. Hover or tap a day for details.`;

  const stats = [
    { label: "Time in the Word", value: formatMinutes(totals.minutes), detail: "Estimated from each day's length", icon: Clock },
    { label: "Days you read", value: totals.activeDays.toLocaleString(), detail: "Across every plan, all time", icon: CalendarCheck },
    { label: "Last 30 days", value: `${totals.activeDaysLast30} of 30`, detail: "Days with at least one reading", icon: Flame },
  ];

  return (
    <figure
      aria-labelledby={titleId}
      className="mt-5 min-w-0 rounded-2xl border border-[#E7CDD3]/60 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] sm:p-5"
    >
      <figcaption id={titleId} className="font-serif text-lg font-bold text-gray-900 dark:text-white">
        Your reading calendar
      </figcaption>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="min-w-0 rounded-xl bg-[#FBF7F3] p-2.5 dark:bg-white/[0.04] sm:p-3">
            {/* The label wraps rather than truncating: on a phone the three
                tiles are narrow, and "Days you re..." says nothing. */}
            <dt className="flex min-w-0 items-start gap-1 text-[11px] font-semibold leading-tight text-gray-600 dark:text-white/65">
              <Icon size={12} aria-hidden="true" className="mt-px shrink-0 text-[#87102C] dark:text-[#FFB3C1]" />
              <span>{label}</span>
            </dt>
            <dd className="mt-1 whitespace-nowrap font-serif text-[15px] font-bold leading-tight text-[#4A0817] dark:text-white sm:text-xl">
              {value}
            </dd>
            <dd className="mt-0.5 hidden text-[10px] leading-snug text-gray-500 dark:text-white/45 sm:block">
              {detail}
            </dd>
          </div>
        ))}
      </dl>

      <p role="status" aria-live="polite" className="mt-4 min-h-[1.25rem] text-xs text-gray-600 dark:text-white/65">
        {readout}
      </p>

      {/* The calendar and its legend share one width, so the legend ends where
          the grid does. Cells fill the card up to a cap: on a wide screen,
          thirty-pixel squares would shout. */}
      <div className="mt-2 max-w-[26rem]">
        <div
          role="img"
          aria-label={`Reading calendar for the last ${windowDays} days: you read on ${daysInWindow} of them.`}
          className="grid w-full gap-[2px]"
          style={{ gridTemplateColumns: `1.75rem repeat(${weeks.length}, minmax(0, 1fr))` }}
          onMouseLeave={() => setSelected(null)}
        >
          <span aria-hidden="true" />
          {labels.map((label, index) => (
            <span
              key={`month-${index}`}
              aria-hidden="true"
              className="h-4 whitespace-nowrap text-[10px] leading-4 text-gray-500 dark:text-white/50"
            >
              {label}
            </span>
          ))}
          {Array.from({ length: 7 }, (_, row) => (
            <Fragment key={row}>
              <span
                aria-hidden="true"
                className="pr-1 text-right text-[10px] leading-[1.125rem] text-gray-500 dark:text-white/50"
              >
                {WEEKDAY_LABEL[row] ?? ""}
              </span>
              {weeks.map((week) => {
                const day = week[row];
                if (!day.inWindow) {
                  return <span key={day.date} data-date={day.date} aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />;
                }
                const level = levelOf(day.readings);
                const isSelected = selected?.date === day.date;
                return (
                  <span
                    key={day.date}
                    data-date={day.date}
                    data-level={level}
                    onMouseEnter={() => setSelected(day)}
                    onClick={() => setSelected(day)}
                    className={`h-[1.125rem] w-[1.125rem] cursor-pointer rounded-[3px] ${LEVEL_CLASS[level]} ${
                      isSelected
                        ? "ring-2 ring-[#4A0817] ring-offset-1 ring-offset-white dark:ring-white dark:ring-offset-[#0b0d12]"
                        : "hover:ring-2 hover:ring-[#4A0817]/60 dark:hover:ring-white/70"
                    }`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div aria-hidden="true" className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-gray-500 dark:text-white/50">
        <span>Less</span>
        {LEVEL_CLASS.map((className, index) => (
          <span key={LEVEL_LABEL[index]} title={LEVEL_LABEL[index]} className={`h-3.5 w-3.5 rounded-[3px] ${className}`} />
        ))}
        <span>More</span>
      </div>

      <table className="sr-only">
        <caption>Days you read in the last {windowDays} days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Readings</th>
          </tr>
        </thead>
        <tbody>
          {activity.days.length === 0 ? (
            <tr>
              <td colSpan={2}>No readings yet</td>
            </tr>
          ) : (
            activity.days.map((day) => (
              <tr key={day.date}>
                <td>{formatDate(day.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</td>
                <td>{day.readings}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </figure>
  );
}

/** The calendar with its own data, so the overview only has to place it. */
export default function ReadingActivitySection() {
  const { data, isLoading, isError, refetch } = useReadingActivity();

  if (isLoading) {
    return <div className="mt-5 h-64 animate-pulse rounded-2xl bg-[#FBF7F3] dark:bg-white/5" />;
  }
  if (isError) {
    return (
      <p role="alert" className="mt-5 text-xs text-gray-500 dark:text-white/55">
        Your reading calendar could not load.{" "}
        <button type="button" onClick={() => refetch()} className="min-h-11 font-semibold underline">
          Try again
        </button>
      </p>
    );
  }
  if (!data) return null;
  return <ReadingActivityView activity={data} />;
}
