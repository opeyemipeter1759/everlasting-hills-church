import {
  buildApplicantWelcomeEmail,
  buildDocumentReuploadEmail,
  buildDocumentsEmail,
  buildPartnerWelcomeEmail,
  buildSignInEmail,
  signInLines,
} from './counselling-documents.email';

const base = { firstName: 'Tunde', email: 'tunde@example.com', appUrl: 'https://example.org/' };
const letters = { consentPdf: Buffer.from('%PDF-a'), medicalPdf: Buffer.from('%PDF-b') };
const phone = { mode: 'PHONE' as const, phoneEnding: '4567' };

const EM_DASH = String.fromCharCode(0x2014);

describe('pre-marital dashboard and documents emails', () => {
  const all = [
    buildApplicantWelcomeEmail({ ...base, signIn: phone, letters }),
    buildApplicantWelcomeEmail({ ...base, signIn: phone, letters: null }),
    buildPartnerWelcomeEmail({ ...base, firstName: 'Ada', email: 'ada@example.com', applicantFirstName: 'Tunde', signIn: phone, letters: null }),
    buildDocumentsEmail({ ...base, signIn: { mode: 'EXISTING', phoneEnding: '4567' }, ...letters }),
    buildSignInEmail({ ...base, signIn: { mode: 'MEMBER', phoneEnding: '4567' } }),
    buildDocumentReuploadEmail(base),
  ];

  it('keep the address out of the logs, carry no em dashes and nothing medical beyond the letter name', () => {
    for (const p of all) {
      expect(p.redactRecipient).toBe(true);
      expect(p.text).not.toContain(EM_DASH);
      expect(p.html).not.toContain(EM_DASH);
      expect(p.text.toLowerCase()).not.toMatch(/hiv|hepatitis|genotype|syphilis/);
    }
  });

  it('tell a new account to sign in with the phone number, digits only, naming it only by its last four digits', () => {
    const [welcome] = all;
    expect(welcome.text).toContain('https://example.org/login');
    expect(welcome.text).toContain('tunde@example.com');
    expect(welcome.text).toContain('phone number, written as digits only');
    expect(welcome.text).toContain('ending in 4567');
    expect(welcome.text).toContain('choose your own password straight away');
    expect(welcome.html).toContain('How to sign in');
  });

  it('attach the two letters under names with no personal details, and still welcome the couple when the letters failed', () => {
    const files = all[0].attachments as { filename: string; content: Buffer }[];
    expect(files.map((f) => f.filename)).toEqual(['Parental-Consent.pdf', 'Medical-Screening-Requirement.pdf']);
    expect(all[1].attachments).toBeUndefined();
    expect(all[1].text).toContain('How to sign in');
    expect(all[1].text).toContain('will be on your dashboard');
  });

  it('give the partner their own welcome, naming the applicant by first name only', () => {
    const partner = all[2];
    expect(partner.to).toBe('ada@example.com');
    expect(partner.text).toContain('Tunde has applied for pre-marital counselling for you both');
    expect(partner.text).toContain('ada@example.com');
    expect(partner.text).not.toContain('tunde@example.com');
  });

  it('explain each way of signing in', () => {
    const at = (mode: Parameters<typeof signInLines>[0]['mode']) => signInLines({ mode, phoneEnding: '1234' }, 'x@example.com', 'https://example.org').join(' ');
    expect(at('EXISTING')).toContain('password you chose before');
    expect(at('FORGOT')).toContain('Forgot password');
    expect(at('MEMBER')).toContain('usual Everlasting Hills account');
    expect(at('FAILED')).toContain('still setting up your dashboard');
    expect(at('FAILED')).not.toContain('/login');
  });

  it('the re-upload notice never says which document or why (that is only on the dashboard)', () => {
    const notice = all[5];
    expect(notice.text).toContain('Sign in to your counselling dashboard to see which one and why');
    expect(notice.text.toLowerCase()).not.toMatch(/consent|certificate|unreadable|signature/);
  });
});
