import type { Prisma } from '@prisma/client';
import { DEFAULT_SITE_IDENTITY, SiteIdentitySchema } from '../cms/schemas/site-config.schema';
import { CHURCH_INFO } from './church-info';

export interface ChurchLink {
  label: string;
  href: string;
}

type Db = Pick<Prisma.TransactionClient, 'siteConfig'>;

/**
 * The links a first-timer's welcome email ends with: the church website, the
 * social accounts the website itself shows (read from its settings, so the
 * email and the site never disagree), the WhatsApp community, and the Telegram
 * channel for audio sermons. An account the website leaves blank is skipped.
 */
export async function welcomeLinks(db: Db, tenantId: string, websiteUrl: string): Promise<ChurchLink[]> {
  let content: unknown = null;
  try {
    content = (await db.siteConfig.findUnique({ where: { tenantId }, select: { content: true } }))?.content ?? null;
  } catch {
    // The welcome still goes, with the usual links.
  }
  // Only the socials matter here, so a site config that fails elsewhere still gives them.
  const parsed = SiteIdentitySchema.shape.socials.safeParse((content as { socials?: unknown } | null)?.socials ?? DEFAULT_SITE_IDENTITY.socials);
  const socials = parsed.success ? parsed.data : DEFAULT_SITE_IDENTITY.socials;
  const links: ChurchLink[] = [
    { label: 'Our website', href: websiteUrl.replace(/\/$/, '') },
    { label: 'Facebook', href: socials.facebook },
    { label: 'Instagram', href: socials.instagram },
    { label: 'TikTok', href: socials.tiktok },
    { label: 'WhatsApp Community', href: CHURCH_INFO.whatsappCommunity },
    { label: 'YouTube', href: socials.youtube },
    { label: 'X', href: socials.x },
    { label: 'Telegram (audio sermons)', href: CHURCH_INFO.telegramSermons },
  ];
  return links.filter((l) => !!l.href);
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** The weekday of a church-local date (a Date at UTC midnight for that day), e.g. "Wednesday". */
export function weekdayOf(day: Date): string {
  return WEEKDAYS[day.getUTCDay()];
}
