import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingName, renderEmailLayout } from './layout';

interface Args {
  email: string;
  firstName: string | null;
  /** e.g. "Sunday Service" / "Midweek Service" — the human label, not the row name. */
  serviceLabel: string;
  /** Public site URL, no trailing slash. */
  appUrl: string;
}

/**
 * Where to catch up on a service: the church channel's Live tab, where every
 * streamed service is listed newest first — so this still lands on the right
 * one when the recording is only a few hours old.
 */
export const CATCH_UP_URL = 'https://www.youtube.com/@everlastinghillschurch/streams';

const link = (href: string, label: string) =>
  `<a href="${escapeHtml(href)}" style="color:#87102C;font-weight:700;text-decoration:underline">${escapeHtml(label)}</a>`;

/**
 * "We missed you" — sent to every active member who was marked absent once a
 * service's attendance window has closed. Written by, and signed from, Pastor
 * Opeyemi Peter: no guilt and no counting, just someone noticing, an open door,
 * a place to send a prayer request, and the service to catch up on.
 */
export function buildAttendanceAbsenceEmail({ email, firstName, serviceLabel, appUrl }: Args): SendEmailPayload {
  const base = appUrl.replace(/\/$/, '');
  const prayerUrl = `${base}/prayer-request`;
  const name = greetingName(firstName);
  const dear = name ? `Dear ${name},` : 'Dear friend,';
  const subject = name ? `We missed you in church today, ${name}` : 'We missed you in church today';

  const text = [
    dear,
    '',
    "I wanted to reach out and check in on you. I noticed you were not with us in church today, and I wanted to make sure you're okay.",
    '',
    "As I've mentioned many times, church is family, and you're part of this family. So, beyond seeing you in church, I want you to know that I care about you and what is happening in your life. You don't have to walk through anything alone. If you ever need someone to talk to, my door is always open. And if there's anything you'd like us to pray with you about, you can send in your prayer request here:",
    prayerUrl,
    '',
    `Today's service was a blessing, and I don't want you to miss what was shared. You can catch up on the service here:`,
    CATCH_UP_URL,
    '',
    'Endeavor to be at our next service.',
    '',
    'With love,',
    '',
    'Pastor Opeyemi Peter',
    'Everlasting Hills Church',
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px;font-weight:700">${escapeHtml(dear)}</p>
    <p style="margin:0 0 16px">I wanted to reach out and check in on you. I noticed you were not with us in church today, and I wanted to make sure you&rsquo;re okay.</p>
    <p style="margin:0 0 16px">As I&rsquo;ve mentioned many times, church is family, and you&rsquo;re part of this family. So, beyond seeing you in church, I want you to know that I care about you and what is happening in your life. You don&rsquo;t have to walk through anything alone. If you ever need someone to talk to, my door is always open. And if there&rsquo;s anything you&rsquo;d like us to pray with you about, you can ${link(prayerUrl, 'send in your prayer request here')}.</p>
    <p style="margin:0 0 16px">Today&rsquo;s service was a blessing, and I don&rsquo;t want you to miss what was shared. You can ${link(CATCH_UP_URL, 'catch up on the service here')}.</p>
    <p style="margin:0 0 20px">Endeavor to be at our next service.</p>
    <p style="margin:0">With love,</p>
    <p style="margin:12px 0 0;font-weight:700">Pastor Opeyemi Peter</p>
    <p style="margin:0;color:#4B5563">Everlasting Hills Church</p>
  `;

  const html = renderEmailLayout({
    heading: `We missed you${name ? `, ${escapeHtml(name)}` : ''}.`,
    bodyHtml,
    cta: { label: `Catch up on ${serviceLabel}`, href: CATCH_UP_URL },
  });

  return { to: email, subject, text, html, tag: 'attendance-absence', memberOnly: true };
}
