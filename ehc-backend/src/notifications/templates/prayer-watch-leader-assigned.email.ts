import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  fullName: string;
  slotLabel: string;
  slotTime: string;
  url: string;
}

/** "You're carrying the hour, not just keeping it." Sent the moment an admin names someone leader of their Prayer Watch slot. */
export function buildPrayerWatchLeaderAssignedEmail({ to, fullName, slotLabel, slotTime, url }: Args): SendEmailPayload {
  const text = [
    greetingText(fullName),
    '',
    `You've been made the leader of the ${slotLabel} (${slotTime}) on the Prayer Watch.`,
    '',
    "That means the others praying through that hour are looking to you — to open the time in prayer, keep it anchored, and carry it through to the next watch.",
    '',
    'Thank you for carrying this,',
    'Everlasting Hills Church',
  ].join('\n');

  const bodyHtml = `
    ${greetingHtml(fullName)}
    <p style="margin:0 0 16px">You've been made the leader of the <strong>${escapeHtml(slotLabel)}</strong> (${escapeHtml(slotTime)}) on the Prayer Watch.</p>
    <p style="margin:0 0 16px">That means the others praying through that hour are looking to you — to open the time in prayer, keep it anchored, and carry it through to the next watch.</p>
    <p style="margin:0">Thank you for carrying this.</p>
  `;

  return {
    to,
    subject: `You're now leading the ${slotLabel} (${slotTime})`,
    text,
    html: renderEmailLayout({ heading: `Leading: ${escapeHtml(slotLabel)}`, bodyHtml, cta: { label: 'Open the Prayer Watch', href: url } }),
    tag: 'prayer-watch-leader-assigned',
  };
}
