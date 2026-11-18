import { existsSync } from 'fs';
import { join } from 'path';
import { buildFirstTimerWelcomeEmail, WELCOME_BANNER } from './first-timer-welcome.email';

describe('the first-timer welcome email', () => {
  const email = buildFirstTimerWelcomeEmail({ firstName: 'Ada', email: 'ada@example.com', appUrl: 'https://www.everlastinghills.church', firstVisitDay: 'Wednesday' });

  it('opens with the Welcome Home banner in place of the logo header', () => {
    expect(WELCOME_BANNER.src).toMatch(/^https:\/\/.+\/email\/welcome-home\.jpg$/);
    expect(email.html).toContain(`<img src="${WELCOME_BANNER.src}"`);
    expect(email.html).toContain('alt="Welcome home. We have been praying for you."');
  });

  it('points at a banner file the website actually serves', () => {
    expect(existsSync(join(__dirname, '../../../../everlasting-hills-church/public/email/welcome-home.jpg'))).toBe(true);
  });

  it('keeps the day they came', () => {
    expect(email.html).toContain('Wednesday');
  });
});
