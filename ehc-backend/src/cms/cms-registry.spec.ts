import { CONTENT_TYPES } from './content-types';
import { PAGE_REGISTRY, decodeCmsKey, pageDef } from './page-registry';

/**
 * The public site asks for pages by key (e.g. getStructuredContent("about/cultures")).
 * A key missing here answers 404 and the page silently shows its built-in copy,
 * which is how the Cultures page lost its CMS content. Keep these in step.
 */
describe('CMS page registry', () => {
  it('serves every key the public site reads', () => {
    for (const key of ['home', 'about', 'about/cultures', 'ministries', 'ministries/mens', 'ministries/womens', 'ministries/teens',
      'ministries/couples', 'events', 'visit', 'contact', 'give', 'privacy', 'terms']) {
      expect(pageDef(key)).toBeDefined();
    }
  });

  it('points every structured page at a real content type', () => {
    for (const def of PAGE_REGISTRY.filter((d) => d.editor === 'structured')) {
      expect(CONTENT_TYPES[def.contentType ?? '']).toBeDefined();
    }
  });

  it("has defaults that pass their own schema, so the editor opens on content it can save", () => {
    for (const [name, type] of Object.entries(CONTENT_TYPES)) {
      const result = type.schema.safeParse(type.default);
      if (!result.success) throw new Error(`${name}: ${result.error.message}`);
    }
  });

  it('maps Our Culture to /cultures, seeded with all twelve cultures', () => {
    expect(pageDef('about/cultures')).toMatchObject({ route: '/cultures', contentType: 'cultures' });
    expect((CONTENT_TYPES.cultures.default as { pillars: unknown[] }).pillars).toHaveLength(12);
    expect(decodeCmsKey('about~cultures')).toBe('about/cultures');
  });
});
