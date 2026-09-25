import { eventSectionInputSchema } from './event-section.schema';

describe('eventSectionInputSchema', () => {
  it.each([
    ['RICH_TEXT', { body: 'About this event' }],
    ['SCHEDULE', { introduction: 'Twice daily', tags: ['Prayer'] }],
    ['EXPECTATIONS', { items: [{ title: 'Restoration', description: 'Renewed hunger for God.' }] }],
    ['PRAYER_FOCUS', { focuses: [{ title: 'Restoration', scriptures: ['Romans 12:11'], prayerPoints: ['Pray for fresh fervency.'] }] }],
    ['FAQ', { items: [{ question: 'When?', answer: 'October 2–31.' }] }],
    ['TESTIMONY', { body: 'Tell us what God did.', buttonLabel: 'Share', url: '/testimony' }],
    ['CTA', { body: 'Join us.', buttonLabel: 'Join Live', url: '' }],
  ])('accepts a valid %s section', (type, content) => {
    expect(eventSectionInputSchema.safeParse({ type, content }).success).toBe(true);
  });

  it('rejects content that does not match its discriminant', () => {
    const result = eventSectionInputSchema.safeParse({
      type: 'FAQ',
      content: { body: '<script>alert(1)</script>' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects unsafe external protocols', () => {
    const result = eventSectionInputSchema.safeParse({
      type: 'CTA',
      content: { buttonLabel: 'Open', url: 'javascript:alert(1)' },
    });
    expect(result.success).toBe(false);
  });
});
