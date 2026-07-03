import type { ZodTypeAny } from 'zod';
import { BeliefsSchema, DEFAULT_BELIEFS } from './schemas/structured/beliefs.schema';
import {
  AboutSchema, DEFAULT_ABOUT,
  MinistriesSchema, DEFAULT_MINISTRIES,
  MinistryDetailSchema,
  DEFAULT_MINISTRY_MENS, DEFAULT_MINISTRY_WOMENS,
  DEFAULT_MINISTRY_TEENS, DEFAULT_MINISTRY_COUPLES,
  VisitSchema, DEFAULT_VISIT,
  IntroSchema, DEFAULT_SERMONS_INTRO, DEFAULT_EVENTS_INTRO,
  LegalSchema, DEFAULT_PRIVACY, DEFAULT_TERMS,
  GiveSchema, DEFAULT_GIVE,
  ContactSchema, DEFAULT_CONTACT,
} from './schemas/structured/pages.schema';

/**
 * Registry of STRUCTURED page content types. Designed pages (beliefs, about,
 * pastor, …) keep their bespoke layout and expose only specific fields — each
 * has a Zod schema + a default seeded from the current site content, so the
 * editor opens pre-filled and the public page renders the same design.
 *
 * Free-form pages (legal, blog, fallback) don't appear here — they use the
 * generic block editor (PageContent).
 */
export interface ContentType {
  schema: ZodTypeAny;
  default: unknown;
}

export const CONTENT_TYPES: Record<string, ContentType> = {
  beliefs: { schema: BeliefsSchema, default: DEFAULT_BELIEFS },
  about: { schema: AboutSchema, default: DEFAULT_ABOUT },
  ministries: { schema: MinistriesSchema, default: DEFAULT_MINISTRIES },
  ministryMens: { schema: MinistryDetailSchema, default: DEFAULT_MINISTRY_MENS },
  ministryWomens: { schema: MinistryDetailSchema, default: DEFAULT_MINISTRY_WOMENS },
  ministryTeens: { schema: MinistryDetailSchema, default: DEFAULT_MINISTRY_TEENS },
  ministryCouples: { schema: MinistryDetailSchema, default: DEFAULT_MINISTRY_COUPLES },
  visit: { schema: VisitSchema, default: DEFAULT_VISIT },
  give: { schema: GiveSchema, default: DEFAULT_GIVE },
  contact: { schema: ContactSchema, default: DEFAULT_CONTACT },
  sermonsIntro: { schema: IntroSchema, default: DEFAULT_SERMONS_INTRO },
  eventsIntro: { schema: IntroSchema, default: DEFAULT_EVENTS_INTRO },
  privacyLegal: { schema: LegalSchema, default: DEFAULT_PRIVACY },
  termsLegal: { schema: LegalSchema, default: DEFAULT_TERMS },
};

export function contentType(name?: string | null): ContentType | undefined {
  return name ? CONTENT_TYPES[name] : undefined;
}
