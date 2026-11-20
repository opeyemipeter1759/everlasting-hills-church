import { BadRequestException, Injectable } from '@nestjs/common';

/**
 * Checks and cleans an uploaded document before it is sealed and stored.
 *
 *   - the real type comes from the first bytes, never the name or the
 *     browser's claim: PDF, JPEG or PNG, nothing else
 *   - images are decoded and re-encoded with sharp: turned upright, every
 *     piece of metadata dropped (EXIF, GPS), at most ~2,500 px on the long
 *     edge, at most ~40 MP in, two at a time per instance (512 MiB of memory)
 *   - PDFs are refused when encrypted or when they carry JavaScript, launch
 *     actions, embedded files, rich media or XFA forms. Accepted PDFs are kept
 *     byte for byte, so a digitally signed lab certificate stays valid.
 *
 * Nothing about a file is ever logged: not its name, size, type or contents.
 */
export type DocumentType = 'application/pdf' | 'image/jpeg' | 'image/png';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function detectType(buf: Buffer): DocumentType | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(PNG)) return 'image/png';
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  // The PDF header may sit after a little leading junk (allowed in the first 1 KB).
  if (buf.subarray(0, 1024).includes('%PDF-', 0, 'latin1')) return 'application/pdf';
  return null;
}

/** Keys and actions that make a PDF do something when opened. */
const FORBIDDEN_KEYS = new Set(['JavaScript', 'JS', 'Launch', 'EmbeddedFile', 'EmbeddedFiles', 'RichMedia', 'XFA']);
const FORBIDDEN_ACTIONS = new Set(['JavaScript', 'Launch', 'ImportData', 'SubmitForm', 'GoToE', 'RichMediaExecute']);
/** Long enough that they never turn up by chance inside compressed data. */
const RAW_MARKERS = ['/JavaScript', '/Launch', '/EmbeddedFile', '/RichMedia'];

export const MAX_IMAGE_EDGE = 2500;
export const MAX_INPUT_PIXELS = 40_000_000;
const IMAGE_SLOTS = 2;

const unsafePdf = () =>
  new BadRequestException(
    'This PDF contains active content we cannot accept. Please upload a plain scan or a photo of the document instead.',
  );

@Injectable()
export class UploadInspector {
  private running = 0;
  private readonly waiting: (() => void)[] = [];

  /** Throws a friendly 400 for anything we will not store. */
  async inspectPdf(buf: Buffer): Promise<void> {
    const raw = buf.toString('latin1');
    if (RAW_MARKERS.some((m) => raw.includes(m))) throw unsafePdf();
    const { PDFDocument, PDFDict, PDFName, PDFRawStream } = require('pdf-lib') as typeof import('pdf-lib');
    let doc: import('pdf-lib').PDFDocument;
    try {
      doc = await PDFDocument.load(buf, { updateMetadata: false });
    } catch (err) {
      if ((err as Error).name === 'EncryptedPDFError' || /encrypt/i.test((err as Error).message))
        throw new BadRequestException('This PDF is password-protected. Please upload a copy without a password.');
      throw new BadRequestException('We could not read this PDF. Please upload a clear photo or scan instead.');
    }
    if (doc.isEncrypted)
      throw new BadRequestException('This PDF is password-protected. Please upload a copy without a password.');
    for (const [, obj] of doc.context.enumerateIndirectObjects()) {
      const dict = obj instanceof PDFDict ? obj : obj instanceof PDFRawStream ? obj.dict : null;
      if (!dict) continue;
      for (const [key, value] of dict.entries()) {
        const name = key.decodeText();
        if (FORBIDDEN_KEYS.has(name)) throw unsafePdf();
        if (name === 'S' && value instanceof PDFName && FORBIDDEN_ACTIONS.has(value.decodeText())) throw unsafePdf();
        if (name === 'Type' && value instanceof PDFName && value.decodeText() === 'EmbeddedFile') throw unsafePdf();
      }
    }
  }

  /** A clean copy of an image, in the same format, with no metadata. */
  async cleanImage(buf: Buffer, type: 'image/jpeg' | 'image/png'): Promise<Buffer> {
    const sharp = require('sharp') as typeof import('sharp');
    sharp.cache(false);
    await this.slot();
    try {
      const pipeline = sharp(buf, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' })
        .rotate()
        .resize({ width: MAX_IMAGE_EDGE, height: MAX_IMAGE_EDGE, fit: 'inside', withoutEnlargement: true });
      return await (type === 'image/png'
        ? pipeline.png({ compressionLevel: 9 })
        : pipeline.jpeg({ quality: 85 })
      ).toBuffer();
    } catch {
      throw new BadRequestException(
        'We could not read this image. Please take a new photo, or upload a smaller one (under 40 megapixels).',
      );
    } finally {
      this.release();
    }
  }

  private slot(): Promise<void> {
    if (this.running < IMAGE_SLOTS) {
      this.running++;
      return Promise.resolve();
    }
    return new Promise((resolve) => this.waiting.push(resolve));
  }

  private release() {
    const next = this.waiting.shift();
    if (next) next();
    else this.running--;
  }
}
