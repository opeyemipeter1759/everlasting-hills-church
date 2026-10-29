import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  fullName: string;
  slotLabel: string;
  slotTime: string;
  url: string;
}

/** "Thanks for signing up — an admin needs to approve it before it's confirmed." */
export function buildPrayerWatchSignupPendingEmail({ to, fullName, slotLabel, slotTime, url }: Args): SendEmailPayload {
  const text = [
    greetingText(fullName),
    '',
    `Thank you for signing up for the ${slotLabel} (${slotTime}) on the Prayer Watch.`,
    '',
    "An admin reviews every sign-up before it's confirmed. We'll let you know as soon as it is.",
  ].join('\n');

  const bodyHtml = `
    ${greetingHtml(fullName)}
    <p style="margin:0 0 16px">Thank you for signing up for the <strong>${escapeHtml(slotLabel)}</strong> (${escapeHtml(slotTime)}) on the Prayer Watch.</p>
    <p style="margin:0">An admin reviews every sign-up before it's confirmed. We'll let you know as soon as it is.</p>
  `;

  return {
    to,
    subject: `Your Prayer Watch sign-up: ${slotTime}, awaiting approval`,
    text,
    html: renderEmailLayout({ heading: 'Awaiting approval', bodyHtml, cta: { label: 'View the Prayer Watch', href: url } }),
    tag: 'prayer-watch-signup-pending',
  };
}
