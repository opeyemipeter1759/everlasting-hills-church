import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';
import { CHURCH_INFO } from '../church-info';

interface Args {
  firstName: string;
  email: string;
  /** Public site URL, no trailing slash. */
  appUrl: string;
}

/**
 * Warm welcome to a first-time guest immediately after they submit the
 * first-timer form. Confirms we received them, sets expectations, shares
 * service times + address, and offers ways to stay connected (socials).
 */
export function buildFirstTimerWelcomeEmail({ firstName, email, appUrl }: Args): SendEmailPayload {
  const base = appUrl.replace(/\/$/, '');
  const socials = CHURCH_INFO.socials.filter((s) => s.href);

  const subject = `Welcome to the Everlasting Hills family, ${firstName}`;

  const text = [
    `Hi ${firstName},`,
    '',
    'Welcome to the Everlasting Hills Church family! We are so glad you chose to worship with us, and we hope your time here felt like a breath of fresh air.',
    '',
    "You are not here by accident. We believe God has a plan and a purpose for your life, and we'd love to walk alongside you on that journey. Whether Sunday was your first step or you've been searching for a place to belong, know that there is a seat with your name on it here at EHC.",
    '',
    'Service times:',
    ...CHURCH_INFO.services.map((s) => `  • ${s.name}: ${s.time}`),
    `Address: ${CHURCH_INFO.address}`,
    '',
    "We'd love to stay connected with you! Here are a few ways to keep up with everything happening at Everlasting Hills:",
    ...socials.map((s) => `  • ${s.label}: ${s.href}`),
    '',
    'Feel free to reach out if you have any questions, need prayer, or simply want to learn more about our community. Our doors and hearts are always open.',
    '',
    "We can't wait to see you again!",
    '',
    'With love,',
    'Everlasting Hills Church',
  ].join('\n');

  const serviceRows = CHURCH_INFO.services
    .map(
      (s) =>
        `<tr><td style="padding:6px 0;font-weight:700;color:#111;font-size:14px">${escapeHtml(s.name)}</td><td style="padding:6px 0;color:#4B5563;text-align:right;font-size:14px">${escapeHtml(s.time)}</td></tr>`,
    )
    .join('');

  const socialPills = socials
    .map(
      (s) =>
        `<a href="${s.href}" style="display:inline-block;margin:4px 6px 4px 0;padding:8px 14px;border-radius:999px;background:#FFF4F6;border:1px solid #E7CDD3;color:#87102C;text-decoration:none;font-size:13px;font-weight:700">${escapeHtml(s.label)}</a>`,
    )
    .join('');

  const bodyHtml = `
    <p style="margin:0 0 16px">Welcome to the <strong>Everlasting Hills Church</strong> family! We are so glad you chose to worship with us, and we hope your time here felt like a breath of fresh air.</p>
    <p style="margin:0 0 20px">You are not here by accident. We believe God has a plan and a purpose for your life, and we'd love to walk alongside you on that journey. Whether Sunday was your first step or you've been searching for a place to belong, know that there is a seat with your name on it here at EHC.</p>

    <div style="background:#FFF4F6;border:1px solid #E7CDD3;border-radius:12px;padding:18px 20px;margin:0 0 22px">
      <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:800;color:#87102C">Plan your next visit</p>
      <table style="width:100%;border-collapse:collapse">${serviceRows}</table>
      <p style="margin:12px 0 0;font-size:13px;color:#4B5563">📍 ${escapeHtml(CHURCH_INFO.address)}</p>
    </div>

    <p style="margin:0 0 12px">We'd love to stay connected with you! Here are a few ways to keep up with everything happening at Everlasting Hills:</p>
    <div style="margin:0 0 22px">${socialPills}</div>

    <p style="margin:0 0 18px">Feel free to reach out if you have any questions, need prayer, or simply want to learn more about our community. Our doors and hearts are always open.</p>
    <p style="margin:0 0 4px">We can't wait to see you again!</p>
    <p style="margin:0;color:#87102C;font-weight:700">With love,<br/>Everlasting Hills Church</p>
  `;

  const html = renderEmailLayout({
    heading: `Welcome, ${escapeHtml(firstName)}.`,
    bodyHtml,
    cta: { label: 'Plan your next visit', href: `${base}/visit` },
  });

  return { to: email, subject, text, html, tag: 'first-timer-welcome' };
}
