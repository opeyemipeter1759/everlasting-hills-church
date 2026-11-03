"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useSlots, type HostSummary } from "@/lib/api/one-on-one";
import { usePublicSlots } from "@/lib/api/one-on-one-public";
import { btnPrimary, durationLabel, formatTime, lagosToday } from "../manage/ui";
import { Portrait, dualTime } from "./parts";

type Slot = { startsAt: string; endsAt: string };

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthOf(date: string): string {
  return date.slice(0, 7);
}

function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

function monthEnd(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

/** Monday-first cells for a month; null pads the first week. */
function monthCells(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`)];
}

function monthTitle(month: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" }).format(new Date(`${month}-01T00:00:00Z`));
}

function dayTitle(date: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T00:00:00Z`));
}

export default function BookingPanel({
  host,
  hostIndex,
  sessionTypeId,
  onBack,
  onNext,
  audience = "member",
  timeZone,
  backLabel = "All pastors",
  anonymous = false,
}: {
  host: HostSummary;
  hostIndex: number;
  sessionTypeId: string;
  onBack: () => void;
  onNext: (slot: Slot) => void;
  audience?: "member" | "visitor";
  /** Visitors see times in their own zone alongside Lagos. */
  timeZone?: string;
  backLabel?: string;
  /** The nameless public page: no portrait, no pastor named. */
  anonymous?: boolean;
}) {
  const today = lagosToday();
  const firstMonth = monthOf(today);
  const lastMonth = shiftMonth(firstMonth, 2);
  const type = host.sessionTypes.find((t) => t.id === sessionTypeId);

  const [month, setMonth] = useState(() => monthOf(host.nextOpening ? new Date(host.nextOpening).toISOString().slice(0, 10) : today));
  const from = month === firstMonth ? today : `${month}-01`;
  const memberSlots = useSlots(audience === "member" ? host.id : null, sessionTypeId, from, monthEnd(month));
  const visitorSlots = usePublicSlots(audience === "visitor" ? host.id : null, sessionTypeId, from, monthEnd(month));
  const slots = audience === "visitor" ? visitorSlots : memberSlots;
  const showTime = (iso: string) => (timeZone ? dualTime(iso, timeZone) : formatTime(iso));
  const byDate = useMemo(() => new Map((slots.data ?? []).map((d) => [d.date, d.slots])), [slots.data]);

  const [date, setDate] = useState<string | null>(null);
  const [picked, setPicked] = useState<Slot | null>(null);

  useEffect(() => {
    if (!slots.data) return;
    if (!date || !byDate.has(date)) setDate(slots.data[0]?.date ?? null);
  }, [slots.data, byDate, date]);
  useEffect(() => setPicked(null), [date, sessionTypeId]);

  const daySlots = date ? (byDate.get(date) ?? []) : [];

  return (
    <div className="grid overflow-hidden rounded-2xl border border-[#E7CDD3]/60 bg-white dark:border-white/[0.09] dark:bg-white/[0.05] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.25fr)_minmax(0,0.8fr)]">
      <div className="flex flex-col gap-4 p-6">
        <button type="button" onClick={onBack} className="inline-flex items-center gap-1 self-start text-sm font-semibold text-[#87102C] hover:underline dark:text-[#FFB3C1]">
          <ArrowLeft size={14} /> {backLabel}
        </button>
        {!anonymous && <Portrait name={host.displayName} index={hostIndex} />}
        <div>
          <p className="text-sm text-[#7A6A6F] dark:text-white/55">{host.displayName}</p>
          <h2 className="font-serif text-2xl font-bold text-[#111] dark:text-white">{type?.name}</h2>
        </div>
        <dl className="grid gap-2.5 text-sm">
          <div>
            <dt className="text-xs font-semibold text-[#7A6A6F] dark:text-white/50">Length</dt>
            <dd className="font-semibold text-[#111] dark:text-white">{type ? durationLabel(type.durationMinutes) : ""}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#7A6A6F] dark:text-white/50">Where</dt>
            <dd className="font-semibold text-[#111] dark:text-white">
              {audience === "visitor" ? "Video call or phone, wherever you are" : "Church office, video call or phone"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#7A6A6F] dark:text-white/50">Approval</dt>
            <dd className="font-semibold text-[#111] dark:text-white">{anonymous ? "A pastor approves every request" : `${host.displayName} approves every request`}</dd>
          </div>
        </dl>
      </div>

      <div className="border-t border-[#E7CDD3]/60 p-6 dark:border-white/[0.07] lg:border-l lg:border-t-0">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#111] dark:text-white">{monthTitle(month)}</h3>
          <div className="flex gap-1.5">
            <button
              type="button"
              aria-label="Previous month"
              disabled={month <= firstMonth}
              onClick={() => setMonth(shiftMonth(month, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E7CDD3] text-[#7A6A6F] hover:bg-[#FFE8ED] disabled:opacity-35 dark:border-white/10 dark:text-white/60"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              aria-label="Next month"
              disabled={month >= lastMonth}
              onClick={() => setMonth(shiftMonth(month, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E7CDD3] text-[#7A6A6F] hover:bg-[#FFE8ED] disabled:opacity-35 dark:border-white/10 dark:text-white/60"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center tabular-nums" role="grid" aria-label={monthTitle(month)}>
          {DOW.map((d) => (
            <span key={d} className="pb-1.5 text-[11px] font-bold text-[#7A6A6F] dark:text-white/45">
              {d}
            </span>
          ))}
          {monthCells(month).map((cell, i) => {
            if (!cell) return <span key={`pad-${i}`} />;
            const open = byDate.has(cell);
            const selected = cell === date;
            const isToday = cell === today;
            return (
              <button
                key={cell}
                type="button"
                disabled={!open}
                aria-pressed={selected}
                aria-label={`${dayTitle(cell)}${open ? ", has open times" : ""}`}
                onClick={() => setDate(cell)}
                className={`mx-auto flex aspect-square w-full max-w-[44px] items-center justify-center rounded-full text-sm transition ${
                  selected
                    ? "bg-[#87102C] font-bold text-white"
                    : open
                      ? "bg-[#FFE8ED] font-bold text-[#87102C] hover:bg-[#FBD5DE] dark:bg-[#87102C]/30 dark:text-[#FFB3C1]"
                      : `text-[#7A6A6F]/60 dark:text-white/30 ${isToday ? "ring-1 ring-[#E7CDD3] dark:ring-white/15" : ""}`
                }`}
              >
                {Number(cell.slice(8))}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-[#7A6A6F] dark:text-white/50">
          {slots.isLoading ? "Finding open times…" : slots.isError ? "Couldn’t load open times." : byDate.size === 0 ? "No open times this month. Try the next one." : timeZone && timeZone !== "Africa/Lagos" ? "Times show your time first, then Lagos time." : "Times are in West Africa Time (Lagos)."}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 border-t border-[#E7CDD3]/60 p-6 dark:border-white/[0.07] lg:border-l lg:border-t-0">
        {date ? (
          <>
            <p className="mb-1 text-[15px] font-bold text-[#111] dark:text-white">{dayTitle(date)}</p>
            {daySlots.map((s) =>
              picked?.startsAt === s.startsAt ? (
                <div key={s.startsAt} className="grid grid-cols-2 gap-2">
                  <span className="flex items-center justify-center rounded-xl bg-[#3B2A2E] py-2.5 text-[15px] font-bold tabular-nums text-white dark:bg-white/20">
                    {showTime(s.startsAt)}
                  </span>
                  <button type="button" className={btnPrimary} onClick={() => onNext(s)}>
                    Next
                  </button>
                </div>
              ) : (
                <button
                  key={s.startsAt}
                  type="button"
                  onClick={() => setPicked(s)}
                  className="rounded-xl border-[1.5px] border-[#87102C] py-2.5 text-[15px] font-bold tabular-nums text-[#87102C] transition hover:bg-[#FFE8ED] dark:border-[#FFB3C1]/70 dark:text-[#FFB3C1] dark:hover:bg-white/[0.06]"
                >
                  {showTime(s.startsAt)}
                </button>
              ),
            )}
          </>
        ) : (
          <p className="text-sm text-[#7A6A6F] dark:text-white/50">Pick a highlighted day to see its times.</p>
        )}
      </div>
    </div>
  );
}
