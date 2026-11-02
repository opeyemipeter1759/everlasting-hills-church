import { OneOnOneLinksService } from './one-on-one-links.service';

describe('OneOnOneLinksService', () => {
  const links = new OneOnOneLinksService({ get: (k: string) => (k === 'CMS_PREVIEW_SECRET' ? 'x'.repeat(40) : 'https://www.everlastinghills.church') } as never);

  it('round-trips a booking id through its signed token', () => {
    expect(links.bookingIdFrom(links.tokenFor('b-123'))).toBe('b-123');
  });

  it('rejects a token signed for a different booking, or altered', () => {
    const token = links.tokenFor('b-123');
    expect(links.bookingIdFrom(token.replace('b-123', 'b-124'))).toBeNull();
    expect(links.bookingIdFrom(`${token}x`)).toBeNull();
    expect(links.bookingIdFrom('no-dot')).toBeNull();
  });

  it('builds the visitor link on the public site', () => {
    expect(links.visitorUrl('b-1')).toMatch(/^https:\/\/www\.everlastinghills\.church\/talk-to-a-pastor\/request\/b-1\./);
  });
});
