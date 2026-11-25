import type { EventLocationType, EventSchedule } from "./index";

/** Slim shape returned by GET /events (public index). */
export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  theme: string | null;
  shortDescription: string | null;
  startAt: string;
  endAt: string | null;
  timezone: string;
  locationType: EventLocationType;
  venueName: string | null;
  flyerImageUrl: string | null;
  coverImageUrl: string | null;
  heroImageUrl: string | null;
  socialImageUrl: string | null;
  liveUrl: string | null;
  registrationUrl: string | null;
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  featured: boolean;
  customPath: string | null;
  /** Whether this event is taking RSVPs at all. Cards must not offer to
   * register somebody for an event that was never accepting them. */
  rsvpEnabled: boolean;
  registrationRequired: boolean;
  /** PUBLIC: anyone can see it. PRIVATE: only signed-in members. */
  visibility?: EventVisibility;
  Schedules: EventSchedule[];
  /** Set by the server for listings: start of the current/next session (recurring events). */
  nextStartAt?: string;
}

export type EventVisibility = "PUBLIC" | "PRIVATE";
