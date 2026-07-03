/**
 * The catalogue of editable public pages. This is the source of truth for which
 * pages the CMS exposes; `Page` rows are created lazily on first edit. Keeping a
 * static registry (rather than seeding every page up front) means the CMS sidebar
 * shows every editable surface immediately, even before anything has been edited.
 */
export interface PageDef {
  key: string;
  title: string;
  /** Public route this page renders (used for preview + ISR revalidation). */
  route: string;
  /** Sidebar grouping in the CMS. */
  group: string;
  /** When set, the page is only available if this feature flag is enabled. */
  featureFlag?: string;
  /** High-impact pages get a publish confirmation modal. */
  highImpact?: boolean;
  /**
   * Editor kind. "structured" = a bespoke field form seeded from current content
   * (design preserved). "blocks" (default) = the generic block editor for
   * free-form pages.
   */
  editor?: 'blocks' | 'structured';
  /** For structured pages: the content-type key in content-types.ts. */
  contentType?: string;
}

export const PAGE_REGISTRY: PageDef[] = [
  { key: 'home', title: 'Homepage', route: '/', group: 'Homepage', highImpact: true },

  { key: 'about', title: 'About', route: '/about', group: 'About', editor: 'structured', contentType: 'about' },
  { key: 'about/beliefs', title: 'What We Believe', route: '/beliefs', group: 'About', editor: 'structured', contentType: 'beliefs' },
  { key: 'about/pastor', title: 'Lead Pastor', route: '/pastor', group: 'About' },

  { key: 'ministries', title: 'Ministries', route: '/ministries', group: 'Ministries', editor: 'structured', contentType: 'ministries' },
  { key: 'sermons', title: 'Sermons (intro copy)', route: '/sermons', group: 'Sermons' },
  { key: 'events', title: 'Events (intro copy)', route: '/events', group: 'Events', editor: 'structured', contentType: 'eventsIntro' },

  { key: 'visit', title: 'Plan a Visit', route: '/visit', group: 'Visit', editor: 'structured', contentType: 'visit' },
  { key: 'contact', title: 'Contact', route: '/contact', group: 'Contact' },
  { key: 'give', title: 'Give', route: '/give', group: 'Give' },

  { key: 'privacy', title: 'Privacy Policy', route: '/privacy', group: 'Legal', highImpact: true, editor: 'structured', contentType: 'privacyLegal' },
  { key: 'terms', title: 'Terms of Service', route: '/terms', group: 'Legal', highImpact: true, editor: 'structured', contentType: 'termsLegal' },
  { key: 'cookies', title: 'Cookie Policy', route: '/cookies', group: 'Legal', highImpact: true },

  { key: 'blog', title: 'Blog', route: '/blog', group: 'Blog', featureFlag: 'blog' },

  { key: '404', title: '404 — Not Found', route: '/404', group: 'Fallback' },
  { key: '500', title: '500 — Server Error', route: '/500', group: 'Fallback' },
  { key: 'maintenance', title: 'Maintenance', route: '/maintenance', group: 'Fallback' },
  { key: 'unauthorized', title: 'Unauthorized', route: '/unauthorized', group: 'Fallback' },
];

const BY_KEY = new Map(PAGE_REGISTRY.map((p) => [p.key, p]));

export function pageDef(key: string): PageDef | undefined {
  return BY_KEY.get(key);
}

export function cacheTagFor(key: string): string {
  return `cms:${key}`;
}
