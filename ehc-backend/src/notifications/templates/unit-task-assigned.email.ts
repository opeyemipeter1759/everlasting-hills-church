import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  to: string;
  firstName: string;
  taskTitle: string;
  description: string | null;
  unitName: string;
  assignedByName: string;
  dueDate: Date | null;
  appUrl: string;
}

function formatDue(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Sent to a member the moment a unit task is assigned (or reassigned) to them. */
export function buildUnitTaskAssignedEmail({
  to, firstName, taskTitle, description, unitName, assignedByName, dueDate, appUrl,
}: Args): SendEmailPayload {
  const url = `${appUrl.replace(/\/$/, '')}/dashboard/unit`;
  const due = dueDate ? formatDue(dueDate) : null;

  const text = [
    `Hi ${firstName},`,
    '',
    `${assignedByName} has assigned you a task in ${unitName}:`,
    '',
    `  ${taskTitle}`,
    ...(description ? ['', `  ${description}`] : []),
    ...(due ? ['', `Due: ${due}`] : []),
    '',
    'When you have made progress, open the task and send a report so your lead knows where things stand.',
    '',
    `Open your unit: ${url}`,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(firstName)},</p>
    <p style="margin:0 0 16px"><strong>${escapeHtml(assignedByName)}</strong> has assigned you a task in <strong>${escapeHtml(unitName)}</strong>.</p>
    <div style="background:#FFF;border:1px solid #E5E7EB;border-radius:12px;padding:18px 20px;margin:0 0 20px">
      <p style="margin:0 0 6px;font-size:11pt;font-weight:700;color:#111">${escapeHtml(taskTitle)}</p>
      ${description ? `<p style="margin:0 0 10px;color:#4B5563;white-space:pre-wrap">${escapeHtml(description)}</p>` : ''}
      ${due ? `<p style="margin:0;font-size:10pt;color:#6B7280"><strong>Due:</strong> ${escapeHtml(due)}</p>` : ''}
    </div>
    <p style="margin:0">When you have made progress, open the task and send a report so your lead knows where things stand.</p>
  `;

  return {
    to,
    subject: `New task in ${unitName}: ${taskTitle}`,
    text,
    html: renderEmailLayout({ heading: 'You have a new task', bodyHtml, cta: { label: 'Open my unit', href: url } }),
    tag: 'unit-task-assigned',
  };
}
