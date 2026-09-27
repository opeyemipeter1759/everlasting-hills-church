import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingName, renderEmailLayout } from './layout';

interface Args {
  to: string;
  firstName: string | null;
  title: string;
  typeLabel: string;
  dueLabel: string | null;
  contactName: string | null;
  assignedBy: string;
  url: string;
}

/** "You have a new Evangelism task" — sent to each person a leader assigns it to. */
export function buildEvangelismTaskEmail({ to, firstName, title, typeLabel, dueLabel, contactName, assignedBy, url }: Args): SendEmailPayload {
  const name = greetingName(firstName);
  const details = [
    `Task: ${title}`,
    `Type: ${typeLabel}`,
    ...(contactName ? [`Contact: ${contactName}`] : []),
    ...(dueLabel ? [`Due: ${dueLabel}`] : []),
  ];
  const text = [
    name ? `Hi ${name},` : 'Hi,',
    '',
    `${assignedBy} has given you a new Evangelism task.`,
    '',
    ...details,
    '',
    `Open it here: ${url}`,
  ].join('\n');

  const rows = details
    .map((line) => {
      const [label, ...rest] = line.split(': ');
      return `<tr><td style="padding:4px 12px 4px 0;color:#6B7280;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:4px 0;font-weight:600">${escapeHtml(rest.join(': '))}</td></tr>`;
    })
    .join('');

  const bodyHtml = `
    <p style="margin:0 0 16px">${name ? `Hi ${escapeHtml(name)},` : 'Hi,'}</p>
    <p style="margin:0 0 16px">${escapeHtml(assignedBy)} has given you a new Evangelism task.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px">${rows}</table>
  `;

  return {
    to,
    subject: `New Evangelism task: ${title}`,
    text,
    html: renderEmailLayout({ heading: 'You have a new task', bodyHtml, cta: { label: 'Open My Tasks', href: url } }),
    tag: 'evangelism-task',
    memberOnly: true,
  };
}
