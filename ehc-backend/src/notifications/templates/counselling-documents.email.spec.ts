import {
  buildDocumentCodeEmail,
  buildDocumentLinkEmail,
  buildDocumentReuploadEmail,
  buildDocumentsEmail,
} from './counselling-documents.email';

const base = { firstName: 'Tunde', email: 'tunde@example.com', contactUrl: 'https://example.org/contact' };

const EM_DASH = String.fromCharCode(0x2014);

describe('pre-marital documents emails', () => {
  const all = [
    buildDocumentsEmail({ ...base, link: 'https://example.org/pre-marital-counselling/documents#t=abc', validDays: 60, consentPdf: Buffer.from('%PDF-a'), medicalPdf: Buffer.from('%PDF-b') }),
    buildDocumentLinkEmail({ ...base, link: 'https://example.org/pre-marital-counselling/documents#t=def', validDays: 60 }),
    buildDocumentCodeEmail({ ...base, code: '123456' }),
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

  it('attach the two letters under names with no personal details', () => {
    const files = all[0].attachments as { filename: string; content: Buffer }[];
    expect(files.map((f) => f.filename)).toEqual(['Parental-Consent.pdf', 'Medical-Screening-Requirement.pdf']);
    expect(all[0].text).toContain('#t=abc');
    expect(all[0].text).toContain('60 days');
  });

  it('the re-upload notice never says which document or why (that is only on the secure page)', () => {
    expect(all[3].text).toContain('One of your counselling documents needs to be uploaded again. Please use your secure link');
    expect(all[3].text.toLowerCase()).not.toMatch(/consent|certificate|unreadable|signature/);
  });
});
