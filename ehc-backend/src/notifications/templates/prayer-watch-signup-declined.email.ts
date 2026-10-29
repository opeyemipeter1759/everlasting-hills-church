import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  fullName: string;
  note: string | null;
  url: string;
}

/** "Your sign-up wasn't approved this time — you're welcome to try again." */
export function buildPrayerWatchSignupDeclinedEmail({ to, fullName, note, url }: Args): SendEmailPayload {
  const message = note ?? 'Your sign-up for the Prayer Watch was not approved this time.';
  const text = [greetingText(fullName), '', message, '', `You're welcome to sign up again: ${url}`].join('\n');

  const bodyHtml = `
    ${greetingHtml(fullName)}
    <p style="margin:0 0 16px">${escapeHtml(message)}</p>
    <p style="margin:0">You're welcome to sign up again, for the same hour or a different one.</p>
  `;

  return {
    to,
    subject: 'About your Prayer Watch sign-up',
    text,
    html: renderEmailLayout({ heading: 'About your Prayer Watch sign-up', bodyHtml, cta: { label: 'Sign up again', href: url } }),
    tag: 'prayer-watch-signup-declined',
  };
}
