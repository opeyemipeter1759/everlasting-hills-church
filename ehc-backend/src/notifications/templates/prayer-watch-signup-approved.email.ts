import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

interface Args {
  to: string;
  fullName: string;
  slotLabel: string;
  slotTime: string;
  whatsappLink: string | null;
  telegramLink: string | null;
  url: string;
}

/** "You're in. Your hour is confirmed — here's where to show up." */
export function buildPrayerWatchSignupApprovedEmail({ to, fullName, slotLabel, slotTime, whatsappLink, telegramLink, url }: Args): SendEmailPayload {
  const links = [
    telegramLink ? `Join the Telegram channel where the prayer happens: ${telegramLink}` : null,
    whatsappLink ? `Join your Prayer Watchmen Family on WhatsApp: ${whatsappLink}` : null,
  ].filter((l): l is string => Boolean(l));

  const text = [
    greetingText(fullName),
    '',
    `You're in. Your hour on the Prayer Watch is confirmed: ${slotLabel} (${slotTime}).`,
    '',
    "That hour is yours to carry before the Lord. While you watch, others are holding the hours before and after you, so together the whole night is covered in prayer.",
    ...(links.length ? ['', ...links] : []),
    '',
    'See you on the watch,',
    'Everlasting Hills Church',
  ].join('\n');

  const bodyHtml = `
    ${greetingHtml(fullName)}
    <p style="margin:0 0 16px">You're in. Your hour on the Prayer Watch is confirmed: <strong>${escapeHtml(slotLabel)}</strong> (${escapeHtml(slotTime)}).</p>
    <p style="margin:0 0 16px">That hour is yours to carry before the Lord. While you watch, others are holding the hours before and after you, so together the whole night is covered in prayer.</p>
    ${links.length ? `<ul style="margin:0 0 16px;padding-left:20px">${links.map((l) => `<li style="margin-bottom:6px">${escapeHtml(l)}</li>`).join('')}</ul>` : ''}
    <p style="margin:0">See you on the watch.</p>
  `;

  return {
    to,
    subject: `You're confirmed: ${slotLabel} (${slotTime})`,
    text,
    html: renderEmailLayout({ heading: `Confirmed: ${escapeHtml(slotLabel)}`, bodyHtml, cta: { label: 'Open the Prayer Watch', href: url } }),
    tag: 'prayer-watch-signup-approved',
  };
}
