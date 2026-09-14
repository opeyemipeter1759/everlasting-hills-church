import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  to: string;
  leadFirstName: string;
  authorName: string;
  taskTitle: string;
  unitId: string;
  unitName: string;
  outcomeLabel: string;
  summary: string;
  challenges: string | null;
  nextSteps: string | null;
  appUrl: string;
}

function section(title: string, body: string | null): string {
  if (!body) return '';
  return `
    <p style="margin:14px 0 4px;font-size:9pt;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#6B7280">${title}</p>
    <p style="margin:0;color:#111;white-space:pre-wrap">${escapeHtml(body)}</p>`;
}

/** Sent to a unit's lead/assistants when a member files a report on a task. */
export function buildUnitTaskReportEmail({
  to, leadFirstName, authorName, taskTitle, unitId, unitName, outcomeLabel, summary, challenges, nextSteps, appUrl,
}: Args): SendEmailPayload {
  const url = `${appUrl.replace(/\/$/, '')}/dashboard/unit-lead/${unitId}/tasks`;

  const text = [
    `Hi ${leadFirstName},`,
    '',
    `${authorName} has sent a report on "${taskTitle}" (${unitName}).`,
    '',
    `Status: ${outcomeLabel}`,
    '',
    'What was done:',
    summary,
    ...(challenges ? ['', 'Challenges:', challenges] : []),
    ...(nextSteps ? ['', 'Next steps:', nextSteps] : []),
    '',
    `Review it here: ${url}`,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(leadFirstName)},</p>
    <p style="margin:0 0 16px"><strong>${escapeHtml(authorName)}</strong> has sent a report on <strong>${escapeHtml(taskTitle)}</strong> in ${escapeHtml(unitName)}.</p>
    <div style="background:#FFF;border:1px solid #E5E7EB;border-radius:12px;padding:18px 20px;margin:0 0 20px">
      <p style="margin:0;font-size:10pt;color:#6B7280"><strong>Status:</strong> ${escapeHtml(outcomeLabel)}</p>
      ${section('What was done', summary)}
      ${section('Challenges', challenges)}
      ${section('Next steps', nextSteps)}
    </div>
    <p style="margin:0">Open the task to acknowledge the report or send it back with a note.</p>
  `;

  return {
    to,
    subject: `Task report from ${authorName}: ${taskTitle}`,
    text,
    html: renderEmailLayout({ heading: 'New task report', bodyHtml, cta: { label: 'Review the report', href: url } }),
    tag: 'unit-task-report',
  };
}
