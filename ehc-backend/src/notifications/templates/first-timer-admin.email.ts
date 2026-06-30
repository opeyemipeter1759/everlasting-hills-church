import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, renderEmailLayout } from './layout';
import type { FirstTimerDto } from '../../forms/dto/first-timer.dto';

interface Args {
  data: FirstTimerDto;
  adminEmail: string;
  /** Public site URL, no trailing slash. */
  appUrl: string;
}

function fmt(v: string | boolean | null | undefined): string {
  if (v === true) return 'Yes';
  if (v === false) return 'No';
  return v ?? '—';
}

/**
 * Notification to the pastoral/admin team when a first-timer registers.
 * Includes the full submission and two next-step CTAs: review in the dashboard
 * and assign for follow-up. The dashboard links are login-gated (the secure
 * place for pastoral actions).
 */
export function buildFirstTimerAdminEmail({ data, adminEmail, appUrl }: Args): SendEmailPayload {
  const base = appUrl.replace(/\/$/, '');
  const fullName = `${data.first_name} ${data.last_name}`.trim();
  const reviewUrl = `${base}/dashboard/first-timers`;
  const assignUrl = `${base}/dashboard/members`;

  const rows: [string, string | boolean | null | undefined][] = [
    ['Phone', data.phone_number],
    ['Email', data.email],
    ['Gender', data.gender],
    ['Birthday', [data.birth_day, data.birth_month].filter(Boolean).join(' ') || null],
    ['Attendance', data.attendance_type],
    ['How they heard', data.how_did_you_learn],
    ['Invited by', data.invited_by],
    ['Located in Ibadan', data.located_in_ibadan],
    ['Membership interest', data.membership_interest],
    ['Address', data.address],
    ['Occupation', data.occupation],
    ['Born again', data.born_again],
    ['WhatsApp interest', data.whatsapp_interest],
    ['Prayer point', data.prayer_point],
    ['Service experience', data.service_experience],
  ];

  const text = [
    `New first-timer submission: ${fullName}`,
    '',
    ...rows.map(([k, v]) => `${k}: ${fmt(v)}`),
    '',
    `Review in dashboard: ${reviewUrl}`,
    `Assign for follow-up: ${assignUrl}`,
  ].join('\n');

  const tableRows = rows
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 14px 7px 0;color:#6B7280;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(k)}</td><td style="padding:7px 0;color:#111;font-size:14px;font-weight:600">${escapeHtml(fmt(v))}</td></tr>`,
    )
    .join('');

  const bodyHtml = `
    <p style="margin:0 0 16px">A new first-timer just registered through the website. Here are their details:</p>
    <div style="background:#FFF;border:1px solid #E5E7EB;border-radius:12px;padding:18px 20px;margin:0 0 24px">
      <p style="margin:0 0 14px;font-size:16px;font-weight:800;color:#87102C">${escapeHtml(fullName)}</p>
      <table style="width:100%;border-collapse:collapse">${tableRows}</table>
    </div>
    <div style="text-align:center;margin:8px 0">
      <a href="${reviewUrl}" style="display:inline-block;margin:4px;background:#87102C;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px">Review first-timer →</a>
      <a href="${assignUrl}" style="display:inline-block;margin:4px;background:#fff;color:#87102C;border:1px solid #E7CDD3;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px">Assign for follow-up</a>
    </div>
  `;

  const html = renderEmailLayout({
    heading: `New first-timer: ${escapeHtml(fullName)}`,
    bodyHtml,
  });

  return {
    to: adminEmail,
    subject: `New first-timer: ${fullName}`,
    text,
    html,
    tag: 'first-timer-admin',
  };
}
