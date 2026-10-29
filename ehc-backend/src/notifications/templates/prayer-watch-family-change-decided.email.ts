import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  fullName: string;
  toSlotLabel: string;
  toSlotTime: string;
  approved: boolean;
  note?: string;
  url: string;
}

/** A request to move Prayer Watchmen Family, decided either way. */
export function buildPrayerWatchFamilyChangeDecidedEmail({ to, fullName, toSlotLabel, toSlotTime, approved, note, url }: Args): SendEmailPayload {
  const message = approved
    ? `Your request has been approved. Your Prayer Watchmen Family is now ${toSlotLabel} (${toSlotTime}).`
    : `Your request to move to ${toSlotLabel} (${toSlotTime}) was not approved this time.`;

  const text = [
    greetingText(fullName),
    '',
    message,
    ...(note ? ['', note] : []),
    '',
    approved
      ? 'Stay connected with your new family — they are who you now walk this altar of prayer with.'
      : 'You remain in your current Prayer Watchmen Family. You are welcome to request again.',
  ].join('\n');

  const bodyHtml = `
    ${greetingHtml(fullName)}
    <p style="margin:0 0 16px">${escapeHtml(message)}</p>
    ${note ? `<p style="margin:0 0 16px">${escapeHtml(note)}</p>` : ''}
    <p style="margin:0">${
      approved
        ? 'Stay connected with your new family — they are who you now walk this altar of prayer with.'
        : 'You remain in your current Prayer Watchmen Family. You are welcome to request again.'
    }</p>
  `;

  return {
    to,
    subject: approved ? 'Your Prayer Watchmen Family has changed' : 'About your request to change Prayer Watchmen Family',
    text,
    html: renderEmailLayout({ heading: approved ? 'Your family has changed' : 'About your request', bodyHtml, cta: { label: 'Open the Prayer Watch', href: url } }),
    tag: 'prayer-watch-family-change-decision',
  };
}
