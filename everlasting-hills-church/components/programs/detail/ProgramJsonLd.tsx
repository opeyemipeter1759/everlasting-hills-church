import type { ProgramDetail } from "@/lib/programs";

const SITE = "https://www.everlastinghills.church";
const MODE = {
  IN_PERSON: "https://schema.org/OfflineEventAttendanceMode",
  ONLINE: "https://schema.org/OnlineEventAttendanceMode",
  HYBRID: "https://schema.org/MixedEventAttendanceMode",
} as const;

/**
 * schema.org Events for search engines, for confirmed dates only: the API
 * sends occurrences only once a date is confirmed, so a program whose date is
 * still to be announced produces nothing here.
 */
export function eventsFor(p: ProgramDetail) {
  const url = `${SITE}/programs/${p.slug}`;
  const place = { "@type": "Place", name: p.venue ?? "Everlasting Hills Church", address: { "@type": "PostalAddress", addressLocality: "Ibadan", addressRegion: "Oyo", addressCountry: "NG" } };
  const location = p.format === "ONLINE" && p.streamUrl ? { "@type": "VirtualLocation", url: p.streamUrl } : place;
  return p.occurrences.slice(0, 3).map((o) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: o.label ? `${p.name}: ${o.label}` : p.name,
    description: p.shortDescription,
    startDate: o.start,
    endDate: o.end,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: MODE[p.format],
    location,
    url,
    organizer: { "@type": "Organization", name: "Everlasting Hills Church", url: SITE },
    ...(p.coverUrl || p.logoUrl ? { image: [p.coverUrl ?? p.logoUrl] } : {}),
  }));
}

export function ProgramJsonLd({ program }: { program: ProgramDetail }) {
  const events = eventsFor(program);
  if (!events.length) return null;
  // JSON.stringify output, with "<" escaped so text can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(events).replace(/</g, "\\u003c") }} />;
}
