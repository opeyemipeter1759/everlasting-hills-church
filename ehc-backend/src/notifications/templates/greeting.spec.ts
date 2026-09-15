import { buildEmailBlast } from './email-blast.email';
import { buildAnnouncementEmail } from './announcement.email';
import { buildFirstTimerFollowUpEmail } from './first-timer-follow-up.email';
import {
  DEFAULT_GREETING,
  fillNameTokens,
  getEmailGreeting,
  greetingText,
  hasNameToken,
  normalizeGreeting,
  setEmailGreeting,
} from './layout';

describe('personal greeting', () => {
  it('opens every family of email with "Hello <FirstName>,"', () => {
    const blast = buildEmailBlast({ email: 'd@x.com', firstName: 'Daphne', subject: 'Hi', body: '<p>News</p>' });
    const announcement = buildAnnouncementEmail({ email: 'd@x.com', firstName: 'Daphne', title: 'T', body: 'B' });
    const followUp = buildFirstTimerFollowUpEmail({ email: 'd@x.com', firstName: 'Daphne', appUrl: 'https://x' });

    for (const mail of [blast, announcement, followUp]) {
      expect(mail.html).toContain('Hello Daphne,');
      expect(mail.text.startsWith('Hello Daphne,')).toBe(true);
    }
  });

  it('falls back to a plain "Hello," when the name is missing or blank', () => {
    expect(greetingText(null)).toBe('Hello,');
    expect(greetingText('   ')).toBe('Hello,');
    expect(buildEmailBlast({ email: 'a@x.com', subject: 's', body: '<p>b</p>' }).text.startsWith('Hello,')).toBe(true);
  });

  it('uses only the first word, capitalised', () => {
    expect(greetingText(' daphne grace ')).toBe('Hello Daphne,');
  });

  it('lets the author place the name with {{firstName}} instead of the automatic line', () => {
    const body = '<p>Dear {{ firstName }}, welcome.</p>';
    expect(hasNameToken(body)).toBe(true);
    expect(fillNameTokens('Hi {{name}}', undefined)).toBe('Hi there');

    const mail = buildEmailBlast({ email: 'd@x.com', firstName: 'Daphne', subject: 'For {{firstName}}', body });
    expect(mail.subject).toBe('For Daphne');
    expect(mail.html).toContain('Dear Daphne, welcome.');
    // No doubled greeting.
    expect(mail.html).not.toContain('Hello Daphne,');
    expect(mail.text.startsWith('Dear Daphne')).toBe(true);
  });

  it('escapes a name when substituting into HTML', () => {
    const mail = buildEmailBlast({ email: 'x@x.com', firstName: '<b>', subject: 's', body: '<p>Hi {{firstName}}</p>' });
    expect(mail.html).toContain('Hi &lt;b&gt;');
  });
});

describe('configurable salutation word', () => {
  afterEach(() => setEmailGreeting(null));

  it('lets admins swap "Hello" for their own word', () => {
    setEmailGreeting('Dear');
    expect(greetingText('Daphne')).toBe('Dear Daphne,');
    expect(greetingText(null)).toBe('Dear,');
    const mail = buildAnnouncementEmail({ email: 'd@x.com', firstName: 'Daphne', title: 'T', body: 'B' });
    expect(mail.html).toContain('Dear Daphne,');
    expect(mail.text.startsWith('Dear Daphne,')).toBe(true);
  });

  it('normalises what the admin typed and falls back to the default when blank', () => {
    expect(normalizeGreeting('  Beloved , ')).toBe('Beloved');
    expect(normalizeGreeting('Good   morning:')).toBe('Good morning');
    expect(normalizeGreeting('   ')).toBeNull();
    setEmailGreeting('   ');
    expect(getEmailGreeting()).toBe(DEFAULT_GREETING);
  });
});
