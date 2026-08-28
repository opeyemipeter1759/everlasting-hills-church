import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  to: string;
  pastorFirstName: string;
  fullName: string;
  phone: string | null;
  serviceName: string | null;
  howTheyHeard: string | null;
  note: string | null;
  sentByName: string;
  appUrl: string;
}

function fmt(v: string | null | undefined): string {
  return v && v.trim() ? v : '—';
}

export function buildFollowUpPastorEscalationEmail(args: Args): SendEmailPayload {
  const { to, pastorFirstName, fullName, phone, serviceName, howTheyHeard, note, sentByName, appUrl } = args;
  const url = `${appUrl.replace(/\/$/, '')}/dashboard/pastor/follow-ups`;

  const rows: [string, string | null][] = [
    ['Phone', phone],
    ['Service attended', serviceName],
    ['How they heard about us', howTheyHeard],
    ['Note', note],
  ];

  const text = [
    `Hi Pastor ${pastorFirstName},`,
    '',
    `${sentByName} sent a first-timer your way for a personal call: ${fullName}`,
    '',
    ...rows.map(([k, v]) => `${k}: ${fmt(v)}`),
    '',
    `Open in dashboard: ${url}`,
  ].join('\n');

  const tableRows = rows
    .filter(([, v]) => v && v.trim())
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 14px 7px 0;color:#6B7280;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:7px 0;color:#111;font-size:14px;font-weight:600">${escapeHtml(fmt(v))}</td></tr>`,
    )
    .join('');

  const bodyHtml = `
    <p style="margin:0 0 16px">Hi Pastor ${escapeHtml(pastorFirstName)},</p>
    <p style="margin:0 0 16px"><strong>${escapeHtml(sentByName)}</strong> thought you'd want to personally call this first-timer:</p>
    <div style="background:#FFF;border:1px solid #E5E7EB;border-radius:12px;padding:18px 20px;margin:0 0 24px">
      <p style="margin:0 0 14px;font-size:16px;font-weight:800;color:#87102C">${escapeHtml(fullName)}</p>
      <table style="width:100%;border-collapse:collapse">${tableRows}</table>
    </div>
  `;

  return {
    to,
    subject: `Please call: ${fullName} (first-timer)`,
    text,
    html: renderEmailLayout({ heading: `A first-timer for your call list`, bodyHtml, cta: { label: 'Open your Follow-ups', href: url } }),
    tag: 'follow-up-pastor-escalation',
  };
}
