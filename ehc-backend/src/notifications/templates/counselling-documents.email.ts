import { CHURCH_INFO } from '../church-info';
import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

/**
 * Pre-marital counselling emails about the couple dashboard and documents.
 * Short and general on purpose: no medical detail beyond "medical screening
 * requirement", never anything about results, never the other partner's
 * contact details. A temporary password is never printed: the email names the
 * phone number by its last four digits. Addresses stay out of the logs
 * (redactRecipient).
 */
type Base = { firstName: string; email: string; appUrl: string };

/** How this person signs in (see CoupleAccountsService). FAILED means no account yet. */
export type SignInMode = 'PHONE' | 'EXPIRED' | 'EXISTING' | 'MEMBER' | 'FORGOT' | 'FAILED';
/** expires: PHONE only, the day the temporary password stops working ("28 November 2026"). */
export type SignIn = { mode: SignInMode; phoneEnding: string; expires?: string | null };

const site = (appUrl: string) => appUrl.replace(/\/$/, '');
const loginUrl = (appUrl: string) => `${site(appUrl)}/login`;
/** The dashboard button: sign in, then straight to their pre-marital counselling page. */
export const COUNSELLING_DASHBOARD_PATH = '/dashboard/pre-marital';
export const counsellingDashboardUrl = (appUrl: string) => `${loginUrl(appUrl)}?next=${encodeURIComponent(COUNSELLING_DASHBOARD_PATH)}`;

/** The lines that tell this person how to get into their dashboard. */
export function signInLines(s: SignIn, email: string, appUrl: string): string[] {
  const at = `Go to ${loginUrl(appUrl)} and sign in with this email address (${email}).`;
  switch (s.mode) {
    case 'PHONE':
      return [
        `${at} Your temporary password is your phone number, written as digits only with no spaces or + sign: the number ending in ${s.phoneEnding} that was given on the application.`,
        `You will be asked to choose your own password straight away.${s.expires ? ` The temporary password stops working after ${s.expires}. After that, tap "Forgot password" on the sign-in page.` : ''}`,
      ];
    case 'EXPIRED':
      return [`${at} Your temporary password has expired, so tap "Forgot password" on the sign-in page and we will email you a link to choose your own.`];
    case 'FORGOT':
      return [`${at} The first time, tap "Forgot password" on the sign-in page and we will email you a link to choose your password.`];
    case 'EXISTING':
      return [`${at} Use the password you chose before. If you have forgotten it, tap "Forgot password" on the sign-in page.`];
    case 'MEMBER':
      return ['Sign in to your usual Everlasting Hills account, and you will find Pre-marital counselling in your dashboard menu.'];
    case 'FAILED':
      return ['We are still setting up your dashboard, and we will email your sign-in details as soon as it is ready.'];
  }
}

const signOff = (appUrl: string) => {
  const contactUrl = `${site(appUrl)}/contact`;
  return {
    text: [
      `If you have any questions, call the church office on ${CHURCH_INFO.phone} or write to us at ${contactUrl}.`,
      '',
      'With love,',
      `The Pastoral Team, ${CHURCH_INFO.name}`,
    ],
    html: `<p>If you have any questions, call the church office on ${escapeHtml(CHURCH_INFO.phone)} or <a href="${contactUrl}" style="color:#87102C">write to us</a>.</p><p>With love,<br />The Pastoral Team, ${escapeHtml(CHURCH_INFO.name)}</p>`,
  };
};

function build(
  a: Base & {
    subject: string;
    tag: string;
    paragraphs: string[];
    /** Shown as its own box: how to sign in. */
    signIn?: string[];
    after?: string[];
    cta?: { label: string; href: string };
    attachments?: SendEmailPayload['attachments'];
  },
): SendEmailPayload {
  const end = signOff(a.appUrl);
  const after = a.after ?? [];
  const text = [
    greetingText(a.firstName),
    '',
    ...a.paragraphs.flatMap((p) => [p, '']),
    ...(a.signIn?.length ? ['How to sign in:', ...a.signIn, ''] : []),
    ...after.flatMap((p) => [p, '']),
    ...(a.cta ? [`${a.cta.label}: ${a.cta.href}`, ''] : []),
    ...end.text,
  ].join('\n');
  const box = a.signIn?.length
    ? `<div style="background:#FFF5F7;border:1px solid #F3C6D1;border-radius:10px;padding:16px 18px;margin:18px 0"><p style="margin:0 0 6px;font-weight:700;color:#87102C">How to sign in</p>${a.signIn.map((l) => `<p style="margin:6px 0">${escapeHtml(l)}</p>`).join('')}</div>`
    : '';
  const bodyHtml = [
    `<p>${greetingHtml(a.firstName)}</p>`,
    ...a.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`),
    box,
    ...after.map((p) => `<p>${escapeHtml(p)}</p>`),
    end.html,
  ].join('');
  return {
    to: a.email,
    subject: a.subject,
    text,
    html: renderEmailLayout({ heading: escapeHtml(a.subject), bodyHtml, cta: a.cta }),
    tag: a.tag,
    redactRecipient: true,
    ...(a.attachments?.length ? { attachments: a.attachments } : {}),
  };
}

const letterFiles = (consentPdf: Buffer, medicalPdf: Buffer) => [
  { filename: 'Parental-Consent.pdf', content: consentPdf },
  { filename: 'Medical-Screening-Requirement.pdf', content: medicalPdf },
];
const dashboardCta = (appUrl: string, s: SignIn) =>
  s.mode === 'FAILED' ? undefined : { label: 'Open your dashboard', href: counsellingDashboardUrl(appUrl) };

/**
 * To the person who applied, right after applying: thanks, how to sign in to
 * the dashboard, and the two letters attached. Without letters (they could not
 * be built) it is a plain acknowledgement with the sign-in details.
 */
export function buildApplicantWelcomeEmail(a: Base & { signIn: SignIn; letters: { consentPdf: Buffer; medicalPdf: Buffer } | null }): SendEmailPayload {
  return build({
    ...a,
    subject: 'Your pre-marital counselling application',
    tag: a.letters ? 'counselling-documents' : 'counselling-received',
    paragraphs: [
      'Thank you for applying for pre-marital counselling with us. Your application is safely with the pastoral team, and someone will be in touch about next steps.',
      'You and your partner each have your own counselling dashboard, where you can follow your application and upload your own documents. Everything is done on the website.',
    ],
    signIn: signInLines(a.signIn, a.email, a.appUrl),
    after: a.letters ? LETTERS_ATTACHED : LETTERS_TO_FOLLOW,
    cta: dashboardCta(a.appUrl, a.signIn),
    attachments: a.letters ? letterFiles(a.letters.consentPdf, a.letters.medicalPdf) : undefined,
  });
}

const LETTERS_ATTACHED = [
  'We have attached your two letters, each with your name. The first is a parental consent and blessing letter: one of your parents, either your father or your mother, or a recognised guardian, signs it. The second is your medical screening requirement, with the tests to do.',
  'When they are ready, upload the signed letter and your medical certificate on your dashboard. Please do not send medical results by email or WhatsApp.',
];
const LETTERS_TO_FOLLOW = [
  'Your two letters (the parental consent letter and your medical screening requirement) will be on your dashboard to download, and we will email them to you too.',
];

/** To the partner, right after the application: what this is, how to sign in to their own dashboard, and their own letters. */
export function buildPartnerWelcomeEmail(
  a: Base & { applicantFirstName: string; signIn: SignIn; letters: { consentPdf: Buffer; medicalPdf: Buffer } | null },
): SendEmailPayload {
  return build({
    ...a,
    subject: 'Your pre-marital counselling dashboard',
    tag: 'counselling-partner-welcome',
    paragraphs: [
      `${a.applicantFirstName} has applied for pre-marital counselling for you both at ${CHURCH_INFO.name}. We are glad to be walking with you as you prepare for your marriage.`,
      'You have your own counselling dashboard, where you can follow the application and upload your own documents. Everything is done on the website.',
    ],
    signIn: signInLines(a.signIn, a.email, a.appUrl),
    after: a.letters ? LETTERS_ATTACHED : LETTERS_TO_FOLLOW,
    cta: dashboardCta(a.appUrl, a.signIn),
    attachments: a.letters ? letterFiles(a.letters.consentPdf, a.letters.medicalPdf) : undefined,
  });
}

/** This person's letters again (the office resent them), with a reminder of how to sign in. */
export function buildDocumentsEmail(a: Base & { signIn: SignIn; consentPdf: Buffer; medicalPdf: Buffer }): SendEmailPayload {
  return build({
    ...a,
    subject: 'Your pre-marital counselling letters',
    tag: 'counselling-documents',
    paragraphs: [
      'Here are your two letters again. The first is a parental consent and blessing letter for one of your parents, or a recognised guardian, to sign. The second is your medical screening requirement, with the tests to do.',
      'When they are ready, upload them on your counselling dashboard. Please do not send medical results by email or WhatsApp.',
    ],
    signIn: signInLines(a.signIn, a.email, a.appUrl),
    cta: dashboardCta(a.appUrl, a.signIn),
    attachments: letterFiles(a.consentPdf, a.medicalPdf),
  });
}

/** Sign-in details on their own (the office resent them). */
export function buildSignInEmail(a: Base & { signIn: SignIn }): SendEmailPayload {
  return build({
    ...a,
    subject: 'Signing in to your counselling dashboard',
    tag: 'counselling-sign-in',
    paragraphs: ['Here is how to sign in to your pre-marital counselling dashboard, where you can follow your application and upload your documents.'],
    signIn: signInLines(a.signIn, a.email, a.appUrl),
    cta: dashboardCta(a.appUrl, a.signIn),
  });
}

/** A document needs uploading again. The reason is shown only on the dashboard. */
export function buildDocumentReuploadEmail(a: Base): SendEmailPayload {
  return build({
    ...a,
    subject: 'One of your counselling documents needs another look',
    tag: 'counselling-document-reupload',
    paragraphs: [
      'One of your counselling documents needs to be uploaded again. Sign in to your counselling dashboard to see which one and why.',
    ],
    cta: { label: 'Open your dashboard', href: counsellingDashboardUrl(a.appUrl) },
  });
}
