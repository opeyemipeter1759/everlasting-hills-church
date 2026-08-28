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
  /** Public site root, used for the visitor call-to-action. */
  siteUrl?: string;
  /** Whether this announcement was aimed at a subset of the church. */
  targeted?: boolean;
  /**
   * A first-timer from the Visitor table has no account and no dashboard, so
   * sending them "View in Dashboard" walks them into a login wall, and telling
   * them they are receiving mail "because you are a member" is both untrue and
   * the wrong welcome.
   */
  recipientKind?: 'member' | 'visitor';
}

export function buildAnnouncementEmail({
  email,
  title,
  body,
  dashboardUrl = 'https://everlastinghills.org/dashboard',
  siteUrl = 'https://everlastinghills.org',
  imageUrl,
  targeted = false,
  recipientKind = 'member',
}: Args): SendEmailPayload {
  const isVisitor = recipientKind === 'visitor';
  const audienceNote = isVisitor
    ? 'You are receiving this because you filled in our first-timer form at Everlasting Hills Church. Reply to this email if you would rather not hear from us.'
    : targeted
      ? 'You are receiving this because this announcement was sent to your group at Everlasting Hills Church.'
      : 'You are receiving this because you are part of the Everlasting Hills Church family.';
  const cta = isVisitor
    ? { label: 'Visit our website', href: siteUrl }
    : { label: 'View in Dashboard', href: dashboardUrl };
  const closingLine = isVisitor
    ? ['We would love to see you again:', siteUrl]
    : ['View this and all announcements in your member dashboard:', dashboardUrl];
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
    ...closingLine,
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
      ${escapeHtml(audienceNote)}
    </p>
  `;

  const html = renderEmailLayout({
    heading: escapeHtml(title),
    bodyHtml,
    cta,
  });

  return { to: email, subject: `📢 ${title}`, text, html, tag: 'announcement' };
}
