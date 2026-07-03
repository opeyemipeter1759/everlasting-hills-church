import type { ZodTypeAny } from 'zod';
import { BeliefsSchema, DEFAULT_BELIEFS } from './schemas/structured/beliefs.schema';
import {
  AboutSchema, DEFAULT_ABOUT,
  MinistriesSchema, DEFAULT_MINISTRIES,
  VisitSchema, DEFAULT_VISIT,
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
  visit: { schema: VisitSchema, default: DEFAULT_VISIT },
};

export function contentType(name?: string | null): ContentType | undefined {
  return name ? CONTENT_TYPES[name] : undefined;
}
