import { CHURCH_INFO } from '../church-info';
import type { SendEmailPayload } from '../notification-events';
import { escapeHtml, greetingHtml, greetingText, renderEmailLayout } from './layout';

/**
 * Pre-marital documents emails. Short and general on purpose: no medical
 * detail beyond "medical screening requirement", never anything about results,
 * never the partner's details. The upload link is the only private thing in
 * them, and only the person it was made for receives it. Addresses are kept out
 * of the logs (redactRecipient).
 */
type Base = { firstName: string; email: string; contactUrl: string };

const signOff = (contactUrl: string) => ({
  text: [
    `If you have any questions, call the church office on ${CHURCH_INFO.phone} or write to us at ${contactUrl}.`,
    '',
    'With love,',
    `The Pastoral Team, ${CHURCH_INFO.name}`,
  ],
  html: `<p>If you have any questions, call the church office on ${escapeHtml(CHURCH_INFO.phone)} or <a href="${contactUrl}" style="color:#87102C">write to us</a>.</p><p>With love,<br />The Pastoral Team, ${escapeHtml(CHURCH_INFO.name)}</p>`,
});

function build(a: Base & { subject: string; tag: string; paragraphs: string[]; cta?: { label: string; href: string }; attachments?: SendEmailPayload['attachments'] }): SendEmailPayload {
  const end = signOff(a.contactUrl);
  const text = [
    greetingText(a.firstName),
    '',
    ...a.paragraphs.flatMap((p) => [p, '']),
    ...(a.cta ? [`${a.cta.label}: ${a.cta.href}`, ''] : []),
    ...end.text,
  ].join('\n');
  const bodyHtml = [
    `<p>${greetingHtml(a.firstName)}</p>`,
    ...a.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`),
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

/** The one email after applying: thanks, the two letters attached, and the secure upload link. */
export function buildDocumentsEmail(a: Base & { link: string; validDays: number; consentPdf: Buffer; medicalPdf: Buffer }): SendEmailPayload {
  return build({
    ...a,
    subject: 'Your pre-marital counselling application and documents',
    tag: 'counselling-documents',
    paragraphs: [
      'Thank you for applying for pre-marital counselling with us. Your application is safely with the pastoral team, and someone will be in touch about next steps.',
      'We have attached two letters for you. The first is a parental consent and blessing letter, one letter for both families to sign. The second is the medical screening requirement for you both.',
      `When they are ready, upload the signed letter and your medical certificates using your secure link below, or bring them to the church office. The link works for ${a.validDays} days. Please do not send medical results by email or WhatsApp.`,
    ],
    cta: { label: 'Upload your documents', href: a.link },
    attachments: [
      { filename: 'Parental-Consent.pdf', content: a.consentPdf },
      { filename: 'Medical-Screening-Requirement.pdf', content: a.medicalPdf },
    ],
  });
}

/** A new link (sent when the office reissues one). The old one has stopped working. */
export function buildDocumentLinkEmail(a: Base & { link: string; validDays: number }): SendEmailPayload {
  return build({
    ...a,
    subject: 'Your new link for your counselling documents',
    tag: 'counselling-document-link',
    paragraphs: [
      'Here is a new secure link for uploading your pre-marital counselling documents. Any link we sent you before no longer works.',
      `This one works for ${a.validDays} days. You can also bring your documents to the church office.`,
    ],
    cta: { label: 'Upload your documents', href: a.link },
  });
}

/** The six-digit code for the upload page. */
export function buildDocumentCodeEmail(a: Base & { code: string }): SendEmailPayload {
  return build({
    ...a,
    subject: 'Your code for the documents page',
    tag: 'counselling-document-code',
    paragraphs: [
      `Your code is ${a.code}. Enter it on the documents page to continue. It works for 10 minutes.`,
      'If you did not ask for a code, you can ignore this email. Nobody can open your documents page without it.',
    ],
  });
}

/** A document needs uploading again. The reason is shown only on the secure page. */
export function buildDocumentReuploadEmail(a: Base): SendEmailPayload {
  return build({
    ...a,
    subject: 'One of your counselling documents needs another look',
    tag: 'counselling-document-reupload',
    paragraphs: [
      'One of your counselling documents needs to be uploaded again. Please use your secure link to see which one and why.',
      'If your link has stopped working, the church office can send you a new one.',
    ],
  });
}
