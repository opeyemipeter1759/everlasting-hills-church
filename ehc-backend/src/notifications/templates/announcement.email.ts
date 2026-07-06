import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  email: string;
  title: string;
  body: string;
  dashboardUrl?: string;
}

export function buildAnnouncementEmail({
  email,
  title,
  body,
  dashboardUrl = 'https://everlastinghills.org/dashboard',
}: Args): SendEmailPayload {
  const text = [
    `📢 ${title}`,
    '',
    body,
    '',
    'View this and all announcements in your member dashboard:',
    dashboardUrl,
    '',
    '— Everlasting Hills Church · Ibadan',
  ].join('\n');

  const bodyHtml = `
    <div style="background:#FFF4F6;border-left:4px solid #87102C;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#87102C">Church Announcement</p>
    </div>
    ${escapeHtml(body)
      .split(/\n{2,}/)
      .map((p) => `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('')}
    <p style="color:#9CA3AF;font-size:13px;margin:24px 0 0">
      You're receiving this because you're a member of Everlasting Hills Church.
    </p>
  `;

  const html = renderEmailLayout({
    heading: escapeHtml(title),
    bodyHtml,
    cta: { label: 'View in Dashboard', href: dashboardUrl },
  });

  return { to: email, subject: `📢 ${title}`, text, html, tag: 'announcement' };
}
