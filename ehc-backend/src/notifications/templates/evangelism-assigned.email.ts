import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingName, renderEmailLayout } from './layout';

interface Args {
  to: string;
  firstName: string | null;
  contactName: string;
  assignedBy: string;
  url: string;
}

/** "You've been asked to follow up someone the team preached to." */
export function buildEvangelismAssignedEmail({ to, firstName, contactName, assignedBy, url }: Args): SendEmailPayload {
  const name = greetingName(firstName);
  const text = [
    name ? `Hi ${name},` : 'Hi,',
    '',
    `${assignedBy} has asked you to follow up ${contactName}, someone the Evangelism Team preached to.`,
    '',
    `Their details and the team's feedback are here: ${url}`,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px">${name ? `Hi ${escapeHtml(name)},` : 'Hi,'}</p>
    <p style="margin:0 0 16px">${escapeHtml(assignedBy)} has asked you to follow up <strong>${escapeHtml(contactName)}</strong>, someone the Evangelism Team preached to.</p>
    <p style="margin:0">Their details and the team&rsquo;s feedback are waiting for you.</p>
  `;

  return {
    to,
    subject: `Please follow up ${contactName}`,
    text,
    html: renderEmailLayout({ heading: `Follow up ${escapeHtml(contactName)}`, bodyHtml, cta: { label: 'Open their details', href: url } }),
    tag: 'evangelism-assigned',
    memberOnly: true,
  };
}
