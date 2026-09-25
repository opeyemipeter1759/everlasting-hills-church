import { buildEventAnnouncementBody, formatEventTimeOfDay } from './announcement-from-event.util';

const base = {
  tagline: null,
  shortDescription: null,
  description: null,
  venueName: null,
  startAt: new Date('2026-10-02T09:00:00.000Z'),
};

describe('buildEventAnnouncementBody', () => {
  it('leads with the tagline the event was given', () => {
    const body = buildEventAnnouncementBody({ ...base, tagline: 'Dominion' });

    expect(body.startsWith('Dominion')).toBe(true);
  });

  it('falls back through short description to description', () => {
    expect(buildEventAnnouncementBody({ ...base, shortDescription: 'Thirty days' })).toContain(
      'Thirty days',
    );
    expect(buildEventAnnouncementBody({ ...base, description: 'A long season' })).toContain(
      'A long season',
    );
  });

  // An announcement is a nudge toward the event page, not a second copy of it.
  it('truncates a long description rather than reprinting the whole event', () => {
    const body = buildEventAnnouncementBody({ ...base, description: 'x'.repeat(600) });

    expect(body.length).toBeLessThan(400);
    expect(body).toContain('…');
  });

  it('says when and where under the summary', () => {
    const body = buildEventAnnouncementBody({
      ...base,
      tagline: 'Dominion',
      venueName: 'Youtube Channel',
    });

    expect(body).toContain('Friday, 2 October 2026');
    expect(body).toContain('Youtube Channel');
  });

  it('still says something for an event with no copy at all', () => {
    expect(buildEventAnnouncementBody(base)).toContain('A new event has been published');
  });

  // Whitespace-only fields are as empty as nulls and must not win the fallback.
  it('treats a blank tagline as absent', () => {
    const body = buildEventAnnouncementBody({ ...base, tagline: '   ', shortDescription: 'Real' });

    expect(body).toContain('Real');
  });
});

describe('formatEventTimeOfDay', () => {
  // Church time, not the server's — a Cloud Run box runs UTC.
  it('renders the start time in Lagos time', () => {
    expect(formatEventTimeOfDay(new Date('2026-10-02T09:00:00.000Z'))).toBe('10:00 AM');
  });
});
