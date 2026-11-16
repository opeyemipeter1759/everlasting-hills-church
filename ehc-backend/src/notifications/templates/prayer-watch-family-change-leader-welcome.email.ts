import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  leaderFullName: string;
  memberFullName: string;
  toSlotLabel: string;
  toSlotTime: string;
  url: string;
}

/** Sent to a Prayer Watchmen Family's leader the moment someone's approved
 * family-change request lands them in that leader's own slot — the mirror
 * of buildPrayerWatchFamilyChangeLeaderNoticeEmail, sent to the slot gaining
 * the person rather than the one losing them. */
export function buildPrayerWatchFamilyChangeLeaderWelcomeEmail({ to, leaderFullName, memberFullName, toSlotLabel, toSlotTime, url }: Args): SendEmailPayload {
  const message = `${memberFullName} has joined your ${toSlotLabel} (${toSlotTime}) Prayer Watchmen Family.`;
  const ask = "Please welcome them and add them to the family's WhatsApp group.";
  const thanks = 'Thank you for your commitment and for carrying this family.';

  const text = [greetingText(leaderFullName), '', message, '', ask, '', thanks].join('\n');

  const bodyHtml = `
    ${greetingHtml(leaderFullName)}
    <p style="margin:0 0 16px">${escapeHtml(message)}</p>
    <p style="margin:0 0 16px">${escapeHtml(ask)}</p>
    <p style="margin:0">${escapeHtml(thanks)}</p>
  `;

  return {
    to,
    subject: `${memberFullName} has joined your Prayer Watchmen Family`,
    text,
    html: renderEmailLayout({ heading: 'A family update', bodyHtml, cta: { label: 'Open the Prayer Watch', href: url } }),
    tag: 'prayer-watch-family-change-leader-welcome',
  };
}
