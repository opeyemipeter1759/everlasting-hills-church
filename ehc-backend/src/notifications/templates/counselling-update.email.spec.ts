import {
  buildCounsellingEmail,
  type CounsellingEmailEvent,
} from './counselling-update.email';
import { scrubEvent } from '../../observability/scrub-event';

const EM_DASH = String.fromCharCode(0x2014);

const EVENTS: CounsellingEmailEvent[] = [
  'RECEIVED',
  'INFO_REQUESTED',
  'STATUS_UPDATED',
  'COUNSELLOR_ASSIGNED',
  'SESSION_SCHEDULED',
  'SESSION_RESCHEDULED',
  'SESSION_CANCELLED',
  'SESSION_REMINDER',
  'COMPLETED',
];

describe('counselling emails', () => {
  it.each(EVENTS)(
    '%s is general: greeting, the event, how to reach the church, and no address in the logs',
    (event) => {
      const mail = buildCounsellingEmail({
        firstName: 'Tunde',
        email: 'tunde@example.com',
        event,
        appUrl: 'https://www.everlastinghills.church',
      });
      expect(mail.text).toContain('Tunde');
      expect(mail.text).toContain(
        'https://www.everlastinghills.church/contact',
      );
      expect(mail.text).not.toMatch(/partner|intro|note|reason/i);
      expect(mail.redactRecipient).toBe(true);
      expect(mail.tag).toMatch(/^counselling-/);
      expect(`${mail.subject}${mail.text}`).not.toContain(EM_DASH);
      // Open your dashboard signs them in and lands on their counselling page, not the dashboard home.
      expect(mail.html).toContain('https://www.everlastinghills.church/login?next=%2Fdashboard%2Fpre-marital');
    },
  );

  it('gives the time in Lagos when there is one', () => {
    const mail = buildCounsellingEmail({
      firstName: 'Ada',
      email: 'a@example.com',
      event: 'SESSION_REMINDER',
      when: 'Tuesday, 1 December 2026 at 12:30 am',
      appUrl: 'https://x.org',
    });
    expect(mail.text).toContain(
      'When: Tuesday, 1 December 2026 at 12:30 am (Lagos time)',
    );
  });
});

describe('error reports (Sentry)', () => {
  it('carry no request body, cookies or query, and no counselling answers', () => {
    const event = scrubEvent({
      request: {
        url: '/public/premarital/applications',
        data: '{"intro":"private"}',
        cookies: 'sb=1',
        query_string: 'a=b',
      },
      extra: {
        applicantEmail: 'a@example.com',
        partnerPhone: '0803',
        intro: 'private',
        nested: { adminNote: 'x', keep: 1 },
        route: '/x',
      },
      breadcrumbs: [{ data: { partnerFirstName: 'Ada', status: 400 } }],
    });
    expect(event.request).toEqual({ url: '/public/premarital/applications' });
    expect(event.extra).toEqual({ nested: { keep: 1 }, route: '/x' });
    expect(event.breadcrumbs?.[0].data).toEqual({ status: 400 });
  });
});
