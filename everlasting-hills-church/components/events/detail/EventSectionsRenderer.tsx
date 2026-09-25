import { ArrowUpRight } from "lucide-react";
import type { EventDetail, EventSection } from "@/types";
import EventAccordion, { type EventAccordionItem } from "./EventAccordion";
import { formatEventDateRange } from "./event-format";

export default function EventSectionsRenderer({ event }: { event: EventDetail }) {
  if (!event.Sections.length) return null;
  return <>{event.Sections.map((section, index) => <EventSectionView key={section.id} section={section} event={event} index={index} />)}</>;
}

function hasContent(section: EventSection): boolean {
  switch (section.type) {
    case "PRAYER_FOCUS":
      return section.content.focuses.length > 0;
    case "EXPECTATIONS":
      return section.content.items.length > 0;
    case "FAQ":
      return section.content.items.length > 0;
    case "RESPONSE":
      return section.content.actions.length > 0;
    case "RICH_TEXT":
      return Boolean(section.content.body.trim());
    default:
      return true;
  }
}

function EventSectionView({ section, event, index }: { section: EventSection; event: EventDetail; index: number }) {
  if (!section.isVisible || !hasContent(section)) return null;

  if (section.type === "TESTIMONY" || section.type === "CTA") {
    const url = section.content.url || (section.type === "TESTIMONY" ? event.testimonyUrl : event.primaryCtaUrl || event.liveUrl);
    return (
      <section className="bg-[#10080b] px-4 py-20 text-white xs:px-5 sm:px-8 md:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <SectionHeading section={section} dark />
          {section.content.body && <p className="mx-auto mt-5 max-w-2xl whitespace-pre-line text-base leading-8 text-white/65">{section.content.body}</p>}
          {url && <a href={url} target={url.startsWith("http") ? "_blank" : undefined} rel={url.startsWith("http") ? "noopener noreferrer" : undefined} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-7 text-sm font-black uppercase tracking-[0.08em] text-[#6E0C24] hover:bg-[#FFE8ED]">{section.content.buttonLabel}<ArrowUpRight size={15} /></a>}
        </div>
      </section>
    );
  }

  const background = index % 2 === 0 ? "bg-white" : "bg-[#FFF8F9]";
  return (
    <section className={`${background} px-4 py-20 xs:px-5 sm:px-8 md:py-28`}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading section={section} />
        {section.type === "RICH_TEXT" && <p className="mx-auto mt-7 max-w-3xl whitespace-pre-line text-center text-base leading-8 text-[#555] sm:text-lg">{section.content.body}</p>}
        {section.type === "SCHEDULE" && <ScheduleSection section={section} event={event} />}
        {section.type === "EXPECTATIONS" && <ExpectationsSection section={section} />}
        {section.type === "PRAYER_FOCUS" && <PrayerSection section={section} />}
        {section.type === "FAQ" && <div className="mx-auto mt-8 max-w-3xl"><EventAccordion items={section.content.items.map((item) => ({ title: item.question, body: item.answer }))} /></div>}
        {section.type === "RESPONSE" && <ResponseSection section={section} event={event} />}
      </div>
    </section>
  );
}

/**
 * Two or more ways to respond, side by side. Each card carries its own note so
 * somebody reads what they are agreeing to before they open the form rather
 * than only once they are inside it.
 */
function ResponseSection({ section, event }: { section: Extract<EventSection, { type: "RESPONSE" }>; event: EventDetail }) {
  return (
    <div className="mt-8">
      {section.content.introduction && (
        <p className="mx-auto max-w-2xl text-center text-base leading-8 text-[#555]">{section.content.introduction}</p>
      )}
      <div className="mt-9 grid gap-4 sm:grid-cols-2">
        {section.content.actions.map((action, actionIndex) => {
          const url = action.url || (actionIndex === 0 ? event.testimonyUrl : null);
          return (
            <article
              key={`${action.heading}-${actionIndex}`}
              className="flex flex-col rounded-2xl border border-[#E7CDD3] bg-white p-5 xs:p-6"
            >
              <h3 className="text-xl font-black tracking-[-0.02em] text-[#111]">{action.heading}</h3>
              {action.body && <p className="mt-3 flex-1 text-sm leading-7 text-[#555]">{action.body}</p>}
              {action.note && <p className="mt-3 text-xs leading-6 text-[#8a7e80]">{action.note}</p>}
              {url ? (
                <a
                  href={url}
                  target={url.startsWith("http") ? "_blank" : undefined}
                  rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#87102C] px-6 text-sm font-black uppercase tracking-[0.06em] text-white transition hover:bg-[#6E0C24] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#87102C]/30"
                >
                  {action.buttonLabel}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              ) : (
                // No destination yet — say so rather than render a dead button.
                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#b8a8ac]">
                  Link coming soon
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeading({ section, dark = false }: { section: EventSection; dark?: boolean }) {
  if (!section.title && !section.subtitle) return null;
  return <header className="mx-auto max-w-3xl text-center">{section.subtitle && <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${dark ? "text-[#E7CDD3]" : "text-[#87102C]"}`}>{section.subtitle}</p>}{section.title && <h2 className={`mt-3 text-balance text-3xl font-black tracking-[-0.035em] sm:text-5xl ${dark ? "text-white" : "text-[#111]"}`}>{section.title}</h2>}</header>;
}

function ScheduleSection({ section, event }: { section: Extract<EventSection, { type: "SCHEDULE" }>; event: EventDetail }) {
  if (!event.Schedules.length) return null;
  return <div className="mt-10"><p className="mx-auto max-w-2xl text-center text-base leading-7 text-[#666]">{section.content.introduction}</p><p className="mt-4 text-center text-xs font-black uppercase tracking-[0.18em] text-[#87102C]">Every day · {formatEventDateRange(event.startAt, event.endAt, event.timezone)}</p><div className="mx-auto mt-8 grid max-w-3xl gap-px overflow-hidden rounded-2xl border border-[#E7CDD3] bg-[#E7CDD3] sm:grid-cols-2">{event.Schedules.map((schedule) => <div key={schedule.id} className="bg-white p-6 sm:p-8"><p className="text-3xl font-black tracking-tight text-[#87102C]">{formatClock(schedule.startTime)}</p><h3 className="mt-2 text-lg font-bold text-[#111]">{schedule.title}</h3>{schedule.description && <p className="mt-2 text-sm leading-6 text-[#666]">{schedule.description}</p>}</div>)}</div>{section.content.tags.length > 0 && <ul className="mt-7 flex flex-wrap justify-center gap-2">{section.content.tags.map((tag) => <li key={tag} className="rounded-full border border-[#E7CDD3] bg-white px-4 py-2 text-xs font-bold text-[#6E0C24]">{tag}</li>)}</ul>}</div>;
}

function ExpectationsSection({ section }: { section: Extract<EventSection, { type: "EXPECTATIONS" }> }) {
  return <div className="mt-10">{section.content.introduction && <p className="mx-auto mb-8 max-w-2xl text-center leading-7 text-[#666]">{section.content.introduction}</p>}<ol className="grid gap-px overflow-hidden rounded-2xl border border-[#E7CDD3] bg-[#E7CDD3] md:grid-cols-2">{section.content.items.map((item, index) => <li key={`${item.title}-${index}`} className="bg-white p-6 sm:p-8"><span className="text-xs font-black text-[#87102C]">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-4 text-xl font-black leading-tight text-[#111]">{item.title}</h3><p className="mt-3 text-sm leading-7 text-[#666]">{item.description}</p>{item.scripture && <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#87102C]">{item.scripture}</p>}</li>)}</ol></div>;
}

function PrayerSection({ section }: { section: Extract<EventSection, { type: "PRAYER_FOCUS" }> }) {
  if (!section.content.focuses.length) return <p className="mt-8 text-center text-sm text-[#777]">Prayer focuses will be added soon.</p>;
  const items: EventAccordionItem[] = section.content.focuses.map((focus) => ({ title: focus.title, eyebrow: focus.dayDate, body: focus.introduction, scriptures: focus.scriptures, points: focus.prayerPoints, declaration: focus.declaration }));
  return <div className="mx-auto mt-8 max-w-3xl"><EventAccordion items={items} /></div>;
}

function formatClock(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}
