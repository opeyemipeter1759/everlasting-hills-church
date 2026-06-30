import type { SendEmailPayload } from './notification-events';

interface BuildArgs {
  firstName: string;
  email: string;
  /** Used as the initial password (church convention). */
  phone: string;
  /** Public site URL (e.g. https://everlasting-hills-church.vercel.app). No trailing slash. */
  appUrl: string;
  /** "admin-created" or "visitor-converted" — only used as a logging tag, not visible to recipient. */
  source: 'admin-created' | 'visitor-converted';
  /** Member record id — rendered as a friendly member code (EHC-XXXX). */
  memberId?: string;
}

/** Stable, human-readable member code derived from the record id (matches the dashboard). */
export function memberCode(id: string): string {
  return `EHC-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

/**
 * Welcome email for a newly-created member account. Same content + branding regardless of
 * whether the admin created the user manually or the visitor-conversion flow did it.
 *
 * Content rules:
 *   - Lead with belonging ("You are now part of the family"), not with credentials.
 *   - Credentials in a clearly-fenced block so the user can copy them.
 *   - Member benefits short and concrete — enough to make logging in feel worth it.
 *   - Single CTA: log in. Don't dilute it with a second button.
 */
export function buildMemberWelcomeEmail(args: BuildArgs): SendEmailPayload {
  const { firstName, email, phone, appUrl, source, memberId } = args;
  const loginUrl = `${appUrl.replace(/\/$/, '')}/login`;
  const code = memberId ? memberCode(memberId) : null;

  const subject = `Welcome to Everlasting Hills, ${firstName} — your member account is ready`;

  const text = [
    `Welcome, ${firstName} — you are now part of the Everlasting Hills family.`,
    '',
    'Your member portal is ready. Use the credentials below to sign in for the first time.',
    '',
    `  Login URL:  ${loginUrl}`,
    ...(code ? [`  Member ID:  ${code}`] : []),
    `  Email:      ${email}`,
    `  Password:   ${phone}   (your phone number — change it on first login)`,
    '',
    'Inside the portal you can:',
    '  • Listen to the latest sermons (audio, video, transcripts)',
    '  • Check in on Sunday and build your attendance streak',
    '  • Read and respond to weekly discussion questions',
    '  • Bookmark sermons, save notes, and track what you have listened to',
    '  • Receive pastoral updates and prayer follow-ups',
    '  • Join a unit (small group) and stay connected mid-week',
    '  • Give online and view your giving history',
    '  • Update your profile, photo, and notification preferences',
    '',
    'You will be asked to set a new password on your first sign-in.',
    '',
    'Welcome home.',
    '— Everlasting Hills Church · Ibadan',
  ].join('\n');

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827">
    <div style="max-width:560px;margin:0 auto;padding:32px 20px">
      <div style="background:linear-gradient(135deg,#87102C,#6E0C24);border-radius:16px;padding:32px 24px;text-align:center;margin-bottom:24px">
        <p style="color:#FBD38D;margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:3px;font-weight:700">Everlasting Hills</p>
        <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.3px">Community Church</h1>
      </div>

      <h2 style="color:#111827;font-size:24px;font-weight:800;margin:0 0 8px">Welcome home, ${escapeHtml(firstName)}.</h2>
      <p style="color:#4B5563;font-size:15px;line-height:1.65;margin:0 0 24px">
        You are now part of the Everlasting Hills family. Your member account is ready —
        sign in to step into everything God has stored up for this season.
      </p>

      <div style="background:#FFF;border:1px solid #E5E7EB;border-radius:12px;padding:20px 22px;margin-bottom:24px">
        <p style="margin:0 0 14px;font-size:11px;color:#6B7280;text-transform:uppercase;letter-spacing:2px;font-weight:800">Your sign-in details</p>
        <p style="margin:0 0 10px;font-size:14px;color:#111"><strong>Login URL:</strong> <a href="${loginUrl}" style="color:#87102C;text-decoration:none">${loginUrl}</a></p>
        ${code ? `<p style="margin:0 0 10px;font-size:14px;color:#111"><strong>Member ID:</strong> <span style="font-family:monospace;color:#87102C;font-weight:700">${code}</span></p>` : ''}
        <p style="margin:0 0 10px;font-size:14px;color:#111"><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p style="margin:0;font-size:14px;color:#111"><strong>Temporary password:</strong> ${escapeHtml(phone)} <span style="color:#6B7280">(your phone number)</span></p>
      </div>

      <p style="margin:0 0 12px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:2px;font-weight:800">What's waiting inside</p>
      <ul style="list-style:none;padding:0;margin:0 0 28px;font-size:14px;color:#374151;line-height:1.65">
        <li style="padding:8px 0;border-bottom:1px solid #F3F4F6">🎧 <strong>Sermons</strong> — listen, watch, read transcripts, save bookmarks</li>
        <li style="padding:8px 0;border-bottom:1px solid #F3F4F6">📍 <strong>Sunday check-in</strong> — log your attendance and build a streak</li>
        <li style="padding:8px 0;border-bottom:1px solid #F3F4F6">💬 <strong>Discussion questions</strong> — weekly prompts from the message</li>
        <li style="padding:8px 0;border-bottom:1px solid #F3F4F6">📓 <strong>Sermon notes</strong> — write and revisit your own reflections</li>
        <li style="padding:8px 0;border-bottom:1px solid #F3F4F6">🤝 <strong>Units</strong> — join a small group and stay connected mid-week</li>
        <li style="padding:8px 0;border-bottom:1px solid #F3F4F6">🙏 <strong>Pastoral care</strong> — prayer follow-ups and direct messages</li>
        <li style="padding:8px 0;border-bottom:1px solid #F3F4F6">💝 <strong>Online giving</strong> — give securely and view your history</li>
        <li style="padding:8px 0">👤 <strong>Your profile</strong> — photo, contact info, notification preferences</li>
      </ul>

      <div style="text-align:center;margin:32px 0">
        <a href="${loginUrl}" style="display:inline-block;background:#87102C;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.3px">Sign in to your portal →</a>
      </div>

      <p style="font-size:13px;color:#6B7280;line-height:1.6;margin:0 0 24px">
        For your security, you will be asked to set a new password on your first sign-in.
      </p>

      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0"/>
      <p style="color:#9CA3AF;font-size:11px;margin:0;text-align:center;line-height:1.6">
        Everlasting Hills Community Church · Ibadan, Nigeria<br/>
        Raising men and women who flourish beyond limits.
      </p>
    </div>
  </body>
</html>`;

  return {
    to: email,
    subject,
    text,
    html,
    tag: `member-welcome:${source}`,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
