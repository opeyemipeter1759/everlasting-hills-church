import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  leaderFullName: string;
  memberFullName: string;
  fromSlotLabel: string;
  fromSlotTime: string;
  toSlotLabel: string;
  url: string;
}

/** Sent to a Prayer Watchmen Family's leader the moment one of their own
 * approved sign-ups moves to a different watch hour — so the leader hears it
 * from the church, not by the person just going quiet in the group. */
export function buildPrayerWatchFamilyChangeLeaderNoticeEmail({
  to,
  leaderFullName,
  memberFullName,
  fromSlotLabel,
  fromSlotTime,
  toSlotLabel,
  url,
}: Args): SendEmailPayload {
  const message = `${memberFullName} has moved from your ${fromSlotLabel} (${fromSlotTime}) Prayer Watchmen Family to a different watch hour (${toSlotLabel}).`;
  const ask = "Please let the rest of the family know, and remove them from the family's WhatsApp group whenever you get a chance.";

  const text = [
    greetingText(leaderFullName),
    '',
    message,
    '',
    ask,
    '',
    'Thank you for carrying this family,',
    'Everlasting Hills Church',
  ].join('\n');

  const bodyHtml = `
    ${greetingHtml(leaderFullName)}
    <p style="margin:0 0 16px">${escapeHtml(message)}</p>
    <p style="margin:0 0 16px">${escapeHtml(ask)}</p>
    <p style="margin:0">Thank you for carrying this family.</p>
  `;

  return {
    to,
    subject: `${memberFullName} has moved to a different watch hour`,
    text,
    html: renderEmailLayout({ heading: 'A family update', bodyHtml, cta: { label: 'Open the Prayer Watch', href: url } }),
    tag: 'prayer-watch-family-change-leader-notice',
  };
}
