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

  describe('FASTING_SCHEDULE', () => {
    const furnace = {
      startDate: '2026-10-02',
      endDate: '2026-10-31',
      mealTime: '3pm',
      dryFasts: [
        { startDate: '2026-10-03', endDate: '2026-10-04', breakTime: '3pm' },
        { startDate: '2026-10-09', endDate: '2026-10-11', breakTime: '3pm' },
      ],
      morningTime: '6am',
      eveningTime: '8pm',
      noMorningDays: [0],
      noEveningDays: [6],
      serviceDays: [0],
      guidelines: [{ title: 'One meal days', body: 'Drink water.' }],
      scriptureText: 'But who can endure the day of his coming?',
      scriptureReference: 'Malachi 3:2',
    };

    it("accepts Furnace '26 as set out in its fasting schedule", () => {
      expect(eventSectionInputSchema.safeParse({ type: 'FASTING_SCHEDULE', content: furnace }).success).toBe(true);
    });

    it('rejects a dry fast outside the fast, or one that ends before it starts', () => {
      const outside = { ...furnace, dryFasts: [{ startDate: '2026-11-01', endDate: '2026-11-02', breakTime: '3pm' }] };
      const backwards = { ...furnace, dryFasts: [{ startDate: '2026-10-11', endDate: '2026-10-09', breakTime: '3pm' }] };
      expect(eventSectionInputSchema.safeParse({ type: 'FASTING_SCHEDULE', content: outside }).success).toBe(false);
      expect(eventSectionInputSchema.safeParse({ type: 'FASTING_SCHEDULE', content: backwards }).success).toBe(false);
    });

    it('rejects dates that are not YYYY-MM-DD, and weekdays out of range', () => {
      expect(eventSectionInputSchema.safeParse({ type: 'FASTING_SCHEDULE', content: { ...furnace, startDate: '2 Oct' } }).success).toBe(false);
      expect(eventSectionInputSchema.safeParse({ type: 'FASTING_SCHEDULE', content: { ...furnace, noEveningDays: [7] } }).success).toBe(false);
    });
  });
});
