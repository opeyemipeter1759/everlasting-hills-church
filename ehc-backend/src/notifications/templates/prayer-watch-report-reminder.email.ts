import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  fullName: string;
  slotLabel: string;
  /** "Monday": the evening the night began. */
  nightName: string;
  /** The watch after this one and who leads it, or null when this watch closes the night. */
  next: { label: string; leaderName: string | null } | null;
  url: string;
}

/** Sent to a watch leader a little after their watch ends, when no report has come in for it yet. */
export function buildPrayerWatchReportReminderEmail({ to, fullName, slotLabel, nightName, next, url }: Args): SendEmailPayload {
  const handover = next
    ? `and confirm you handed over to ${next.leaderName ? `${next.leaderName} on the ${next.label}` : `the ${next.label}`}`
    : 'and confirm you closed the night';
  const thanks = `Thank you for keeping the ${slotLabel} on ${nightName} night.`;
  const ask = `When you have a minute, please add the report for it. Put in when you started and finished and how many of you prayed, ${handover}.`;
  const why = 'It only takes a minute, and it lets the church see the watch being carried from one hour to the next, night after night.';
  const cover = 'If someone else in the family led the watch, you can still send the report for them.';

  const text = [greetingText(fullName), '', thanks, '', ask, '', why, '', cover, '', `Add the report: ${url}`, '', 'Thank you,', 'Everlasting Hills Church'].join('\n');

  const bodyHtml = `
    ${greetingHtml(fullName)}
    <p style="margin:0 0 16px">${escapeHtml(thanks)}</p>
    <p style="margin:0 0 16px">${escapeHtml(ask)}</p>
    <p style="margin:0 0 16px">${escapeHtml(why)}</p>
    <p style="margin:0 0 16px">${escapeHtml(cover)}</p>
    <p style="margin:0">Thank you,<br>Everlasting Hills Church</p>
  `;

  return {
    to,
    subject: `How did the ${slotLabel} go on ${nightName} night?`,
    text,
    html: renderEmailLayout({ heading: `${slotLabel}, ${nightName} night`, bodyHtml, cta: { label: 'Add the report', href: url } }),
    tag: 'prayer-watch-report-reminder',
  };
}
