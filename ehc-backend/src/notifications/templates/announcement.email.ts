import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';
import { markdownToEmailHtml, stripMarkdown } from '../../common/markdown.util';

interface Args {
  email: string;
  title: string;
  body: string;
  dashboardUrl?: string;
  /** The flyer attached to the announcement, if any. */
  imageUrl?: string | null;
}

export function buildAnnouncementEmail({
  email,
  title,
  body,
  dashboardUrl = 'https://everlastinghills.org/dashboard',
  imageUrl,
}: Args): SendEmailPayload {
  // Referenced by URL rather than attached: the flyer already lives on a public
  // R2 bucket, every mail client can render an https image, and inlining a
  // multi-MB JPEG into a church-wide blast would push messages past provider
  // size limits and into spam folders. Only absolute https URLs are emitted —
  // a relative path would resolve against the mail client, not the site.
  const flyerHtml =
    imageUrl && /^https:\/\//i.test(imageUrl)
      ? `<img src="${escapeHtml(imageUrl)}" alt="" width="560" style="display:block;width:100%;max-width:560px;height:auto;border-radius:8px;margin:0 0 20px" />`
      : '';
  const text = [
    `📢 ${title}`,
    '',
    // Plain-text part: markers stripped so a text-only client does not show
    // `**Date:**`.
    stripMarkdown(body),
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
    ${flyerHtml}
    ${markdownToEmailHtml(body, escapeHtml)}
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
