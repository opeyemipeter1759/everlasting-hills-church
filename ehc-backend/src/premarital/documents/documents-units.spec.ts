import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import { DEFAULT_DOCUMENTS_CONFIG, readDocumentsConfig, valuesOf } from './documents-config';
import { DocumentCrypto } from './document-crypto';
import { coupleOf, kindsFor, letterRef, letterVars, longDate, mayOpen, mayReview, maySeeRow, validFrom } from './document-rules';
import { SAMPLE_VARS } from './document-letters.service';
import { blocksSchema, fill, placeholderProblems, SEED_BODIES, textsOf } from './letter-blocks';
import { LetterRenderer, SAFE } from './letter-renderer';
import { detectType, UploadInspector } from './upload-inspector';

const config = (values: Record<string, unknown>) => ({ get: (k: string) => values[k] }) as never;
const KEY = Buffer.alloc(32, 7).toString('base64');

describe('counselling letters', () => {
  const renderer = new LetterRenderer(config({}));
  const s = valuesOf(DEFAULT_DOCUMENTS_CONFIG);
  const render = (kind: 'PARENTAL_CONSENT' | 'MEDICAL_SCREENING', vars = SAMPLE_VARS) =>
    renderer.render({ title: 'Letter', blocks: SEED_BODIES[kind], vars: { ...vars, returnInstructions: s.certReturnInstructions }, tests: s.screeningTests, labs: s.recommendedLabs });

  it('seeds both letters as valid blocks using only the known placeholders, with no "for official use" section', () => {
    for (const kind of ['PARENTAL_CONSENT', 'MEDICAL_SCREENING'] as const) {
      expect(blocksSchema.safeParse(SEED_BODIES[kind]).success).toBe(true);
      for (const t of textsOf(SEED_BODIES[kind])) expect(placeholderProblems(t)).toEqual([]);
      expect(textsOf(SEED_BODIES[kind]).join(' ').toLowerCase()).not.toContain('official use');
    }
  });

  it('promises only that results are kept confidential and seen by the pastorate, never that they are deleted', () => {
    const medical = textsOf(SEED_BODIES.MEDICAL_SCREENING).join(' ');
    expect(medical).toContain('seen only by the pastorate of Everlasting Hills Church');
    expect(medical.toLowerCase()).not.toMatch(/delete|destroy/);
    expect(DEFAULT_DOCUMENTS_CONFIG.medicalConsentWording.value).toBe(
      'I consent to Everlasting Hills Church securely storing this medical certificate for counselling purposes. It will be kept securely and seen only by the pastorate of Everlasting Hills Church.',
    );
    expect(DEFAULT_DOCUMENTS_CONFIG.medicalConsentWording.state).toBe('PENDING_PASTORAL_APPROVAL');
  });

  it('refuses unknown placeholders when saving, and never sends a half-filled letter', () => {
    expect(placeholderProblems('Dear {groomName} and {partnerName}')).toEqual(['{partnerName}']);
    expect(blocksSchema.safeParse([{ type: 'paragraph', text: 'Hello {nope}' }]).success).toBe(false);
    expect(() => fill('Dear {groomName}', { ...SAMPLE_VARS, groomName: '{brideName}' })).toThrow();
    expect(fill('Ref {applicationRef}', SAMPLE_VARS)).toBe('Ref 7K4QH2');
  });

  it('renders the consent letter on one page, on the letterhead, inside the safe area', async () => {
    const out = await render('PARENTAL_CONSENT');
    expect(out.pageCount).toBe(1);
    expect(out.bounds.top).toBeGreaterThanOrEqual(SAFE.top);
    expect(out.bounds.bottom).toBeLessThanOrEqual(SAFE.bottom);
    expect(out.bounds.left).toBeGreaterThanOrEqual(SAFE.left);
    expect(out.bounds.right).toBeLessThanOrEqual(SAFE.right + 0.01);
    const pdf = await PDFDocument.load(out.bytes);
    // The letterhead is drawn on every page as an image.
    expect(Buffer.from(out.bytes).toString('latin1')).toContain('/Subtype /Image');
    expect(pdf.getAuthor()).toBe('Everlasting Hills Church');
  });

  it('runs the medical letter onto further pages, each with the letterhead, still inside the safe area', async () => {
    const out = await render('MEDICAL_SCREENING');
    expect(out.pageCount).toBeGreaterThanOrEqual(1);
    expect(out.bounds.bottom).toBeLessThanOrEqual(SAFE.bottom);
    expect(out.bounds.right).toBeLessThanOrEqual(SAFE.right + 0.01);
  });

  it('wraps a very long name cleanly and still fits the consent letter on one page', async () => {
    const long = 'Oluwaseyifunmilayo Adebayo-Ogunleye Babatunde Akinwunmi Ọlọ́runfẹ́mi';
    const out = await render('PARENTAL_CONSENT', { ...SAMPLE_VARS, groomName: long, brideName: long });
    expect(out.pageCount).toBe(1);
    expect(out.bounds.right).toBeLessThanOrEqual(SAFE.right + 0.01);
    expect(out.bounds.bottom).toBeLessThanOrEqual(SAFE.bottom);
  });
});

describe('document rules', () => {
  const base = { applicantFirstName: 'Ada', applicantLastName: 'Eze', partnerFirstName: 'Tunde', partnerLastName: 'Adeyemi' };

  it('maps groom and bride correctly whichever of them applied', () => {
    expect(coupleOf({ ...base, applicantRole: 'BRIDE' })).toEqual({
      groom: { first: 'Tunde', full: 'Tunde Adeyemi' },
      bride: { first: 'Ada', full: 'Ada Eze' },
    });
    expect(coupleOf({ ...base, applicantRole: 'GROOM' })?.groom.full).toBe('Ada Eze');
    expect(coupleOf({ ...base, applicantRole: null })).toBeNull();
  });

  it('fills the letter values: reference without PMC-, Lagos dates, and the window counted back from the application', () => {
    const vars = letterVars(
      { ...base, applicantRole: 'BRIDE', referenceCode: 'PMC-7K4QH2', submittedAt: new Date('2026-11-20T09:00:00Z') },
      { issueDay: '2026-11-21', validityDays: 30, returnInstructions: 'Bring it in.' },
    );
    expect(vars).toEqual({
      applicationRef: '7K4QH2',
      issueDate: '21 November 2026',
      groomName: 'Tunde Adeyemi',
      brideName: 'Ada Eze',
      applicationDate: '20 November 2026',
      validFromDate: '21 October 2026',
      returnInstructions: 'Bring it in.',
    });
    expect(letterRef('PMC-ABC123')).toBe('ABC123');
    expect(longDate('2026-01-05')).toBe('5 January 2026');
    // 23:30 UTC on the 19th is already the 20th in Lagos.
    expect(validFrom(new Date('2026-11-19T23:30:00Z'), 30)).toBe('2026-10-21');
  });

  it('lets only a Pastor open or review medical certificates', () => {
    for (const k of ['MEDICAL_CERT_GROOM', 'MEDICAL_CERT_BRIDE'] as const) {
      expect(mayOpen('PASTOR', k)).toBe(true);
      for (const t of ['SUPER_ADMIN', 'MINISTRY', 'COUNSELLOR'] as const) {
        expect(mayOpen(t, k)).toBe(false);
        expect(mayReview(t, k)).toBe(false);
      }
      expect(maySeeRow('COUNSELLOR', k)).toBe(false);
    }
    expect(mayOpen('COUNSELLOR', 'PARENTAL_CONSENT')).toBe(true);
    expect(mayReview('COUNSELLOR', 'PARENTAL_CONSENT')).toBe(false);
    expect(mayReview('MINISTRY', 'PARENTAL_CONSENT')).toBe(true);
  });

  it('gives each link only its own slots', () => {
    expect(kindsFor('GROOM')).toEqual(['PARENTAL_CONSENT', 'MEDICAL_CERT_GROOM']);
    expect(kindsFor('BRIDE')).toEqual(['PARENTAL_CONSENT', 'MEDICAL_CERT_BRIDE']);
    expect(kindsFor('ALL')).toHaveLength(3);
  });

  it('falls back to the default for any saved setting that is missing or invalid', () => {
    const c = readDocumentsConfig({ documents: { maxUploadMb: { value: 5, state: 'APPROVED' }, documentPageOtp: { value: 'yes', state: 'APPROVED' } } });
    expect(c.maxUploadMb).toEqual({ value: 5, state: 'APPROVED' });
    expect(c.documentPageOtp).toEqual(DEFAULT_DOCUMENTS_CONFIG.documentPageOtp);
    expect(Object.keys(DEFAULT_DOCUMENTS_CONFIG)).not.toEqual(expect.arrayContaining(['deleteMedicalFilesAfterVerification']));
    expect(Object.keys(DEFAULT_DOCUMENTS_CONFIG).join(' ')).not.toMatch(/grace|retentionDays|delete/i);
    expect(DEFAULT_DOCUMENTS_CONFIG.documentRetentionPolicy).toEqual({ value: '', state: 'PENDING_PASTORAL_APPROVAL' });
  });
});

describe('document encryption', () => {
  const crypto = new DocumentCrypto(config({ COUNSELLING_DOC_KEK_V1: KEY, COUNSELLING_DOC_KEK_CURRENT: 1 }));

  it('seals each file with its own key, so the stored bytes never match the upload, and opens it again', () => {
    const plain = Buffer.from('%PDF-1.4 a medical certificate');
    const a = crypto.encrypt(plain);
    const b = crypto.encrypt(plain);
    expect(a.blob.equals(plain)).toBe(false);
    expect(a.blob.includes(plain)).toBe(false);
    expect(a.wrappedKey.equals(b.wrappedKey)).toBe(false);
    expect(crypto.decrypt(a.blob, a.wrappedKey, a.keyVersion).equals(plain)).toBe(true);
  });

  it('refuses tampered files and keys from another version', () => {
    const a = crypto.encrypt(Buffer.from('hello'));
    const tampered = Buffer.from(a.blob);
    tampered[tampered.length - 1] ^= 1;
    expect(() => crypto.decrypt(tampered, a.wrappedKey, 1)).toThrow();
    expect(() => crypto.decrypt(a.blob, a.wrappedKey, 2)).toThrow();
  });

  it('stores nothing at all without a master key', () => {
    const off = new DocumentCrypto(config({}));
    expect(off.configured).toBe(false);
    expect(() => off.encrypt(Buffer.from('x'))).toThrow(/not set up/);
  });
});

describe('upload checks', () => {
  const inspector = new UploadInspector();

  it('takes the type from the first bytes, so a renamed .exe is refused', () => {
    expect(detectType(Buffer.from('MZ\x90\x00 this is a program'))).toBeNull();
    expect(detectType(Buffer.from('%PDF-1.7\n'))).toBe('application/pdf');
    expect(detectType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
  });

  it('refuses a PDF that carries JavaScript', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    doc.addJavaScript('hello', 'app.alert("hi")');
    await expect(inspector.inspectPdf(Buffer.from(await doc.save()))).rejects.toThrow(/active content/);
  });

  it('refuses an encrypted PDF and accepts a plain one', async () => {
    const plain = await PDFDocument.create();
    plain.addPage();
    const bytes = Buffer.from(await plain.save({ useObjectStreams: false }));
    await expect(inspector.inspectPdf(bytes)).resolves.toBeUndefined();
    const encrypted = Buffer.from(
      bytes.toString('latin1').replace('trailer\n<<', 'trailer\n<<\n/Encrypt << /Filter /Standard /V 1 /R 2 /P -4 >>'),
      'latin1',
    );
    await expect(inspector.inspectPdf(encrypted)).rejects.toThrow(/password|read/);
  });

  it('strips EXIF and GPS from photos and keeps the long edge within 2,500 px', async () => {
    const photo = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#cccccc' } })
      .jpeg()
      .withExif({ IFD0: { Make: 'PhoneMaker', Model: 'Phone' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '7/1 23/1 0/1' } })
      .toBuffer();
    expect((await sharp(photo).metadata()).exif).toBeDefined();
    const clean = await inspector.cleanImage(photo, 'image/jpeg');
    const meta = await sharp(clean).metadata();
    expect(meta.exif).toBeUndefined();
    expect(Math.max(meta.width!, meta.height!)).toBeLessThanOrEqual(2500);
    expect(clean.includes(Buffer.from('PhoneMaker'))).toBe(false);
  });
});

describe('no automatic deletion', () => {
  it('has no scheduled job or timer that touches counselling documents', () => {
    const dir = __dirname;
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts') && !n.endsWith('.spec.ts'))) {
      const src = readFileSync(join(dir, f), 'utf8');
      expect(src).not.toMatch(/@Cron|@Interval|setInterval\(|ScheduleModule/);
    }
    const runner = readFileSync(join(dir, '..', '..', 'scheduling', 'jobs-runner.service.ts'), 'utf8');
    expect(runner).not.toMatch(/document/i);
    const script = readFileSync(join(dir, '..', '..', '..', 'scripts', 'cloud-scheduler-jobs.sh'), 'utf8');
    expect(script).not.toMatch(/document/i);
  });
});
