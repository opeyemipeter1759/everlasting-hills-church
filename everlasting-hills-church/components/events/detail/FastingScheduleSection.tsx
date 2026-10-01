import { Flame, Moon, Sun, UtensilsCrossed } from "lucide-react";
import type { EventSection } from "@/types";
import { dateSpan, planFast, shortDate, weekdayRange, type FastDay } from "./fasting-schedule";

type Section = Extract<EventSection, { type: "FASTING_SCHEDULE" }>;

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LONG_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * A fast set out the way the church's printed schedule does it: the headline
 * numbers, the dry-fast weekends, a day-by-day calendar, when prayer meets,
 * and the guidelines — all worked out from the section's rules.
 */
export default function FastingScheduleSection({ section }: { section: Section }) {
  const c = section.content;
  const plan = planFast(c);
  const breakDays = Array.from(new Set(plan.weekends.map((w) => new Date(`${w.endDate}T00:00:00Z`).getUTCDay())));
  const breakTimes = Array.from(new Set(plan.weekends.map((w) => w.breakTime)));
  const breaking =
    plan.weekends.length && breakDays.length === 1 && breakTimes.length === 1 ? `${LONG_WEEKDAYS[breakDays[0]]} ${breakTimes[0]}` : null;
  const month = new Date(`${c.startDate}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <section className="relative overflow-hidden bg-[#140709] px-4 py-20 text-white xs:px-5 sm:px-8 md:py-28">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-[#C2410C]/25 blur-[120px]" />
      <div className="relative mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          {section.subtitle && <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FDBA74]">{section.subtitle}</p>}
          {section.title && <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.03em] sm:text-5xl">{section.title}</h2>}
          {c.introduction && <p className="mx-auto mt-6 max-w-2xl whitespace-pre-line text-[17px] leading-[1.7] text-white/65">{c.introduction}</p>}
        </header>

        {/* The headline numbers. */}
        <dl className="mt-12 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] lg:grid-cols-4">
          <Fact label="Duration" value={`${plan.totalDays} Days`} note={dateSpan(c.startDate, c.endDate, true)} />
          <Fact label="Daily fast" value="One meal a day" note={`From ${c.mealTime} daily`} />
          {plan.weekends.length > 0 && (
            <Fact label="Dry fast" value={`${plan.dryDays} Days`} note={`${plan.weekends.length === 4 ? "Four" : plan.weekends.length} weekends: ${plan.weekends.map((w) => w.days).join(", ")}`} />
          )}
          {breaking && <Fact label="Breaking" value={breaking} note="Every dry fast weekend" />}
        </dl>

        {plan.weekends.length > 0 && (
          <div className="mt-16">
            <SubHeading eyebrow="The weekends" title={`${plan.dryDays} days of dry fasting`} />
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
              Each dry fast starts after your {c.mealTime} meal the day before
              {breaking ? ` and ends at ${breakTimes[0]} on ${LONG_WEEKDAYS[breakDays[0]]}` : ""}.
            </p>
            <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {plan.weekends.map((w, i) => (
                <li key={w.startDate} className="rounded-2xl border border-[#F97316]/30 bg-gradient-to-b from-[#3B0A0F] to-[#1C0709] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">Weekend {i + 1}</p>
                  <p className="mt-2 flex items-baseline gap-2">
                    <span className="text-5xl font-black leading-none text-[#FACC15]">{w.days}</span>
                    <span className="text-lg font-bold">Days dry</span>
                  </p>
                  <p className="mt-2 flex gap-0.5 text-[#F97316]" aria-hidden="true">
                    {Array.from({ length: w.days }, (_, k) => (
                      <Flame key={k} size={15} fill="currentColor" />
                    ))}
                  </p>
                  <dl className="mt-4 space-y-1.5 text-sm">
                    <Row label="Dry fast" value={dateSpan(w.startDate, w.endDate)} />
                    <Row label="Last meal" value={shortDate(w.lastMealDate)} />
                    <Row label="Break" value={`${shortDate(w.endDate).replace(/ \w+$/, "")}, ${w.breakTime}`} />
                  </dl>
                </li>
              ))}
            </ol>
            <p className="mt-4 flex flex-col gap-1 rounded-xl bg-[#FACC15] px-5 py-3 text-[#1C0709] sm:flex-row sm:items-center sm:gap-4">
              <span className="text-lg font-black">
                {plan.weekends.map((w) => w.days).join(" + ")} = {plan.dryDays} days
              </span>
              {c.note && <span className="text-sm font-semibold">{c.note}</span>}
            </p>
          </div>
        )}

        {/* Day by day. */}
        <div className="mt-16">
          <SubHeading eyebrow="Day by day" title={month} />
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
            <Legend swatch="border border-[#F59E0B] text-[#FCD34D]" label={`One meal a day, from ${c.mealTime}`} />
            {plan.weekends.length > 0 && <Legend swatch="bg-[#DC2626]" label="Dry fast" />}
            {plan.weekends.length > 0 && <Legend swatch="bg-[#FACC15]" label="Dry fast breaks" />}
          </ul>

          {/* Tablet and up: the month as a grid. */}
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-white/10 sm:block">
            <div className="grid grid-cols-7 bg-white/[0.06] text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
              {WEEKDAY_HEADERS.map((d) => (
                <div key={d} className="px-3 py-2.5">
                  {d}
                </div>
              ))}
            </div>
            {plan.weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-t border-white/10">
                {week.map((cell, ci) =>
                  cell ? (
                    <div
                      key={cell.date}
                      className={`min-h-[8.5rem] border-white/10 p-2.5 ${ci > 0 ? "border-l" : ""} ${
                        !cell.inFast ? "bg-black/20" : cell.day?.kind === "dry" ? "bg-[#3B0A0F]" : "bg-white/[0.02]"
                      } ${cell.day?.isFirst || cell.day?.isLast ? "ring-2 ring-inset ring-[#F59E0B]" : ""}`}
                    >
                      <div className="flex items-baseline justify-between gap-1">
                        <span className={`text-xl font-black ${cell.inFast ? "text-white" : "text-white/25"}`}>{cell.dayOfMonth}</span>
                        {cell.day && <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Day {cell.day.dayNumber}</span>}
                      </div>
                      {cell.day && <DayDetail day={cell.day} mealTime={c.mealTime} />}
                    </div>
                  ) : (
                    <div key={ci} />
                  ),
                )}
              </div>
            ))}
          </div>

          {/* Phone: the same days as a list. */}
          <ol className="mt-6 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 sm:hidden">
            {plan.days.map((d) => (
              <li key={d.date} className={`flex gap-4 p-4 ${d.kind === "dry" ? "bg-[#3B0A0F]" : "bg-white/[0.02]"}`}>
                <div className="w-12 shrink-0 text-center">
                  <p className="text-[10px] font-bold uppercase text-white/45">{shortDate(d.date).split(" ")[0]}</p>
                  <p className="text-2xl font-black leading-tight">{d.dayOfMonth}</p>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Day {d.dayNumber}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <DayDetail day={d} mealTime={c.mealTime} />
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* When prayer meets. */}
        {(c.morningTime || c.eveningTime) && (
          <div className="mt-16">
            <SubHeading eyebrow="Prayer sessions" title="Meet at the altar" />
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {c.morningTime && (
                <Session
                  icon={Sun}
                  label="Morning sessions"
                  when={`${weekdayRange(c.noMorningDays.concat(c.serviceDays))} | ${c.morningTime}`}
                  note={c.serviceDays.length ? `${c.serviceDays.map((d) => LONG_WEEKDAYS[d]).join(", ")} mornings are Sunday service.` : undefined}
                />
              )}
              {c.eveningTime && (
                <Session
                  icon={Moon}
                  label="Evening sessions"
                  when={`${weekdayRange(c.noEveningDays)} | ${c.eveningTime}`}
                  note={c.sessionsNote}
                  badge={c.noEveningDays.length ? `No evening session on ${c.noEveningDays.map((d) => LONG_WEEKDAYS[d].slice(0, 3)).join(", ")}.` : undefined}
                />
              )}
            </div>
          </div>
        )}

        {c.guidelines.length > 0 && (
          <div className="mt-16">
            <SubHeading eyebrow="Fast with wisdom" title="Guidelines" />
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {c.guidelines.map((g) => (
                <li key={g.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <p className="flex items-center gap-2 font-bold text-[#FACC15]">
                    <UtensilsCrossed size={15} aria-hidden="true" /> {g.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/65">{g.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {c.scriptureText && (
          <figure className="mx-auto mt-16 max-w-2xl text-center">
            <blockquote className="text-balance font-serif text-xl italic leading-relaxed text-white/85 sm:text-2xl">&ldquo;{c.scriptureText}&rdquo;</blockquote>
            {c.scriptureReference && (
              <figcaption className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[#FDBA74]">{c.scriptureReference}</figcaption>
            )}
          </figure>
        )}
      </div>
    </section>
  );
}

/** What a day holds: the fast, the break, and when prayer meets. */
function DayDetail({ day, mealTime }: { day: FastDay; mealTime: string }) {
  return (
    <div className="mt-1.5 space-y-1 text-[11px] leading-snug">
      {day.kind === "dry" ? (
        <p className="inline-block rounded bg-[#DC2626] px-1.5 py-0.5 font-bold text-white">
          Dry fast {day.dryDay} of {day.dryLength}
        </p>
      ) : (
        <p className="inline-block rounded border border-[#F59E0B] px-1.5 py-0.5 font-bold text-[#FCD34D]">One meal, {mealTime}</p>
      )}
      {day.breakTime && <p className="block w-fit rounded bg-[#FACC15] px-1.5 py-0.5 font-bold text-[#1C0709]">Break {day.breakTime}</p>}
      {day.isFirst && <p className="font-semibold text-[#FDBA74]">Day 1 begins</p>}
      {day.isLast && <p className="font-semibold text-[#FDBA74]">Day {day.dayNumber}, closing</p>}
      <p className="text-white/60">{day.morning ?? <span className="line-through text-white/30">No morning session</span>}</p>
      <p className="text-white/60">{day.evening ?? <span className="line-through text-white/30">No evening session</span>}</p>
    </div>
  );
}

function Fact({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="border-white/10 p-5 [&:nth-child(n+3)]:border-t lg:[&:nth-child(n+3)]:border-t-0 [&:nth-child(even)]:border-l lg:[&:not(:first-child)]:border-l">
      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">{label}</dt>
      <dd className="mt-2 text-2xl font-black leading-tight">{value}</dd>
      {note && <dd className="mt-1 text-xs text-white/55">{note}</dd>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <dt className="w-[4.5rem] shrink-0 text-white/50">{label}</dt>
      <dd className="font-semibold text-white/90">{value}</dd>
    </div>
  );
}

function SubHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#FACC15]">{eyebrow}</p>
      <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">{title}</h3>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm ${swatch}`} /> {label}
    </li>
  );
}

function Session({
  icon: Icon,
  label,
  when,
  note,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  when: string;
  note?: string;
  badge?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
        <Icon size={14} aria-hidden="true" /> {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight">{when}</p>
      {note && <p className="mt-2 text-sm text-white/60">{note}</p>}
      {badge && <p className="mt-3 inline-block rounded bg-[#FACC15] px-2 py-1 text-xs font-black uppercase tracking-wide text-[#1C0709]">{badge}</p>}
    </div>
  );
}
