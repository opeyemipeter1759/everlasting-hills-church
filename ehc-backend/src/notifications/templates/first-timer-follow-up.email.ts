import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  firstName: string;
  email: string;
  /** Public site URL, no trailing slash. */
  appUrl: string;
}

/**
 * Warm follow-up to a first-time guest a few days after their visit. Goal:
 * make them feel seen, lower the barrier to coming back, and point to one next
 * step. No credentials, no pressure.
 */
export function buildFirstTimerFollowUpEmail(args: Args): SendEmailPayload {
  const { firstName, email, appUrl } = args;
  const base = appUrl.replace(/\/$/, '');
  const visitUrl = `${base}/visit`;

  const subject = `It was so good to have you, ${firstName}`;

  const text = [
    `Hi ${firstName},`,
    '',
    'Thank you for worshipping with us at Everlasting Hills. It was a joy to have you in the house, and we hope you felt right at home.',
    '',
    'We would love to see you again this week. If there is anything we can pray about or help you with, just reply to this email.',
    '',
    `Plan your next visit: ${visitUrl}`,
    '',
    'There is always a place for you here.',
    '— The Everlasting Hills family · Ibadan',
  ].join('\n');

  const html = renderEmailLayout({
    heading: `It was so good to have you, ${escapeHtml(firstName)}.`,
    bodyHtml: `
      <p style="margin:0 0 16px">Thank you for worshipping with us at Everlasting Hills. It was a joy to have you in the house, and we hope you felt right at home.</p>
      <p style="margin:0 0 16px">We would love to see you again this week. If there is anything we can pray about or help you with, simply reply to this email and a member of our team will reach out.</p>
      <p style="margin:0">There is always a place for you here.</p>
    `,
    cta: { label: 'Plan your next visit', href: visitUrl },
  });

  return { to: email, subject, text, html, tag: 'first-timer-follow-up' };
}
