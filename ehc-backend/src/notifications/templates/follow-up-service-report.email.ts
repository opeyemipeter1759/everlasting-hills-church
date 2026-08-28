import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';

interface Args {
  to: string;
  recipientFirstName: string;
  unitName: string;
  serviceName: string;
  compiledByName: string;
  summaryText: string;
  stats: { total: number; reached: number; unreachable: number; connectionsIntroduced: number; outstanding: number };
  appUrl: string;
}

export function buildFollowUpServiceReportEmail(args: Args): SendEmailPayload {
  const { to, recipientFirstName, unitName, serviceName, compiledByName, summaryText, stats, appUrl } = args;
  const url = `${appUrl.replace(/\/$/, '')}/dashboard/follow-up`;

  const statLine = `${stats.total} followed up · ${stats.reached} reached · ${stats.unreachable} unreachable · ${stats.connectionsIntroduced} connections introduced · ${stats.outstanding} still open`;

  const text = [
    `Hi ${recipientFirstName},`,
    '',
    `${compiledByName} sent this Follow-Up report for ${unitName} — ${serviceName}.`,
    '',
    statLine,
    '',
    summaryText,
    '',
    `Open in dashboard: ${url}`,
  ].join('\n');

  const bodyHtml = `
    <p style="margin:0 0 16px">Hi ${escapeHtml(recipientFirstName)},</p>
    <p style="margin:0 0 16px"><strong>${escapeHtml(compiledByName)}</strong> sent this Follow-Up report for <strong>${escapeHtml(unitName)}</strong> — ${escapeHtml(serviceName)}.</p>
    <div style="background:#FFF;border:1px solid #E5E7EB;border-radius:12px;padding:18px 20px;margin:0 0 20px">
      <p style="margin:0 0 12px;font-size:12px;font-weight:800;color:#87102C;text-transform:uppercase;letter-spacing:0.4px">${escapeHtml(statLine)}</p>
      <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;line-height:1.7">${escapeHtml(summaryText)}</p>
    </div>
  `;

  return {
    to,
    subject: `Follow-Up report — ${unitName} (${serviceName})`,
    text,
    html: renderEmailLayout({ heading: `${escapeHtml(unitName)} — Follow-Up report`, bodyHtml, cta: { label: 'Open the Follow-Up Pipeline', href: url } }),
    tag: 'follow-up-service-report',
  };
}
