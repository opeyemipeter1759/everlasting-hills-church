import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  to: string;
  workerFirstName: string;
  subjectName: string;
  appUrl: string;
}

export function buildFollowUpAssignedEmail({ to, workerFirstName, subjectName, appUrl }: Args): SendEmailPayload {
  const url = `${appUrl.replace(/\/$/, '')}/dashboard/follow-up`;
  const text = [
    `Hi ${workerFirstName},`,
    '',
    `You've been assigned to follow up with ${subjectName}.`,
    '',
    `Open the Follow-Up Pipeline: ${url}`,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(workerFirstName)},</p>
    <p style="margin:0 0 16px">You've been assigned to follow up with <strong>${escapeHtml(subjectName)}</strong>.</p>
  `;

  return {
    to,
    subject: `You've been assigned to ${subjectName}`,
    text,
    html: renderEmailLayout({ heading: `New assignment: ${escapeHtml(subjectName)}`, bodyHtml, cta: { label: 'Open the Follow-Up Pipeline', href: url } }),
    tag: 'follow-up-assigned',
  };
}
