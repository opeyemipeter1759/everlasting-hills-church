import { Prisma } from '@prisma/client';

/** Fields returned to the public — keeps drafts' internal bits out of summaries. */
export const EVENT_SUMMARY_SELECT = {
  id: true,
  slug: true,
  title: true,
  tagline: true,
  startAt: true,
  endAt: true,
  venueName: true,
  flyerImageUrl: true,
  featured: true,
  customPath: true,
} satisfies Prisma.EventSelect;

/** Fields the calendar grid needs — chips render a title, a time and a status dot. */
export const EVENT_CALENDAR_SELECT = {
  id: true,
  slug: true,
  title: true,
  startAt: true,
  endAt: true,
  status: true,
  featured: true,
  venueName: true,
} satisfies Prisma.EventSelect;
