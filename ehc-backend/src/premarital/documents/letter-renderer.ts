import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import { isAbsolute, join } from 'path';
import type { PDFFont, PDFImage, PDFPage } from 'pdf-lib';
import type { Env } from '../../config/env.validation';
import { fill, type Block, type LetterVars } from './letter-blocks';

/**
 * Builds the letters as PDFs on the EHC letterhead with pdf-lib (no browser).
 * The letterhead is a full-page background on every page; text stays inside
 * the safe area measured from the asset (header ink ends 78 pt from the top,
 * the footer contact line starts at 724.6 pt, with the website since
 * 2026-11-23), so the footer details are never typed again.
 */
export const PAGE = { width: 595.28, height: 841.89 } as const;
/** Measured from the letterhead: points from the top-left corner. */
export const SAFE = { top: 106, bottom: 714, left: 56, right: 595.28 - 56 } as const;

export const DEFAULT_LETTERHEAD = 'assets/letterhead/ehc-letterhead-a4.jpg';
/** The Senior Pastors' signature (ink on transparency), drawn by the sign-off block. */
export const SIGNATURE = 'assets/signature/senior-pastors.png';
const FONT_DIR = 'assets/fonts';

const INK = { r: 0.12, g: 0.12, b: 0.13 };
const SOFT = { r: 0.33, g: 0.33, b: 0.35 };
const BRAND = { r: 0.53, g: 0.063, b: 0.17 };
const RULE = { r: 0.55, g: 0.55, b: 0.57 };

export interface LetterInput {
  title: string;
  blocks: Block[];
  vars: LetterVars;
  tests: string[];
  labs: { name: string; address: string; phone: string }[];
}
export interface RenderedLetter {
  bytes: Uint8Array;
  pageCount: number;
  /** The extent of everything drawn on top of the letterhead, in points from the top-left. */
  bounds: { top: number; bottom: number; left: number; right: number };
}

interface Assets {
  letterhead: Buffer;
  isPng: boolean;
  regular: Buffer;
  semibold: Buffer;
  italic: Buffer;
  serif: Buffer;
  signature: Buffer;
}
type Glyphs = { hasGlyphForCodePoint(cp: number): boolean };
interface Face {
  font: PDFFont;
  glyphs: Glyphs;
}
interface Run {
  text: string;
  face: Face;
}

/* Loaded on first use (not at start-up), so the API starts as fast as before. */
const loadPdfLib = () => require('pdf-lib') as typeof import('pdf-lib');
const loadFontkit = () =>
  ((m: { default?: unknown }) => (m.default ?? m) as Parameters<import('pdf-lib').PDFDocument['registerFontkit']>[0])(
    require('@pdf-lib/fontkit') as { default?: unknown },
  );

const resolve = (p: string) => (isAbsolute(p) ? p : join(process.cwd(), p));

@Injectable()
export class LetterRenderer {
  private assets: Promise<Assets> | null = null;
  private readonly letterheadPath: string;

  constructor(config: ConfigService<Env, true>) {
    this.letterheadPath = resolve(
      (config.get('LETTERHEAD_PATH', { infer: true }) as string | undefined) || DEFAULT_LETTERHEAD,
    );
  }

  private load(): Promise<Assets> {
    this.assets ??= (async () => {
      const [letterhead, regular, semibold, italic, serif, signature] = await Promise.all([
        readFile(this.letterheadPath),
        readFile(resolve(`${FONT_DIR}/InstrumentSans-Regular.ttf`)),
        readFile(resolve(`${FONT_DIR}/InstrumentSans-SemiBold.ttf`)),
        readFile(resolve(`${FONT_DIR}/InstrumentSans-Italic.ttf`)),
        readFile(resolve(`${FONT_DIR}/DMSerifDisplay-Regular.ttf`)),
        readFile(resolve(SIGNATURE)),
      ]);
      return { letterhead, isPng: letterhead[0] === 0x89, regular, semibold, italic, serif, signature };
    })().catch((err: unknown) => {
      this.assets = null;
      throw err;
    });
    return this.assets;
  }

  async render(input: LetterInput): Promise<RenderedLetter> {
    const { PDFDocument, rgb } = loadPdfLib();
    const fontkit = loadFontkit();
    const a = await this.load();
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const face = async (bytes: Buffer): Promise<Face> => ({
      font: await doc.embedFont(bytes, { subset: true }),
      glyphs: fontkit.create(bytes) as unknown as Glyphs,
    });
    const [regular, semibold, italic, serif] = await Promise.all([
      face(a.regular),
      face(a.semibold),
      face(a.italic),
      face(a.serif),
    ]);
    const background: PDFImage = a.isPng ? await doc.embedPng(a.letterhead) : await doc.embedJpg(a.letterhead);
    const signature: PDFImage = await doc.embedPng(a.signature);
    // No personal details in the file's own metadata.
    doc.setTitle(input.title);
    doc.setAuthor('Everlasting Hills Church');
    doc.setCreator('Everlasting Hills Church');
    doc.setProducer('Everlasting Hills Church');

    const bounds = { top: Infinity, bottom: -Infinity, left: Infinity, right: -Infinity };
    let page!: PDFPage;
    let y = 0;
    const newPage = () => {
      page = doc.addPage([PAGE.width, PAGE.height]);
      page.drawImage(background, { x: 0, y: 0, width: PAGE.width, height: PAGE.height });
      y = SAFE.top;
    };
    newPage();
    const fits = (height: number) => y + height <= SAFE.bottom;
    const ensure = (height: number) => {
      if (!fits(height) && y > SAFE.top) newPage();
    };
    const mark = (left: number, right: number, top: number, bottom: number) => {
      bounds.left = Math.min(bounds.left, left);
      bounds.right = Math.max(bounds.right, right);
      bounds.top = Math.min(bounds.top, top);
      bounds.bottom = Math.max(bounds.bottom, bottom);
    };
    const color = (c: { r: number; g: number; b: number }) => rgb(c.r, c.g, c.b);

    /** Characters a font lacks lose their accent (ọ becomes o) rather than print as boxes. */
    const safe = (text: string, f: Face) =>
      Array.from(text)
        .map((ch) => {
          const cp = ch.codePointAt(0)!;
          if (cp < 32 || f.glyphs.hasGlyphForCodePoint(cp)) return cp < 32 ? ' ' : ch;
          const bare = ch.normalize('NFD').replace(/\p{M}/gu, '');
          return bare && Array.from(bare).every((c) => f.glyphs.hasGlyphForCodePoint(c.codePointAt(0)!))
            ? bare
            : '?';
        })
        .join('');

    /** Text with **bold** into runs of words. */
    const runsOf = (text: string, base: Face, bold: Face): Run[] =>
      text
        .split(/(\*\*[^*]+\*\*)/)
        .filter(Boolean)
        .flatMap((part) => {
          const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
          const f = isBold ? bold : base;
          const body = isBold ? part.slice(2, -2) : part;
          return body
            .split(/(\s+)/)
            .filter((w) => w.length > 0)
            .map((w) => ({ text: /^\s+$/.test(w) ? ' ' : safe(w, f), face: f }));
        });

    const width = (r: Run, size: number) => r.face.font.widthOfTextAtSize(r.text, size);

    /** Greedy word wrap. A word longer than the line is broken by characters. */
    const wrap = (runs: Run[], size: number, max: number): Run[][] => {
      const lines: Run[][] = [];
      let line: Run[] = [];
      let used = 0;
      const push = () => {
        while (line.length && line[line.length - 1].text === ' ') line.pop();
        lines.push(line);
        line = [];
        used = 0;
      };
      for (const run of runs) {
        if (run.text === ' ') {
          if (line.length) {
            line.push(run);
            used += width(run, size);
          }
          continue;
        }
        let w = width(run, size);
        if (used + w > max && line.length) push();
        let rest = run;
        while (w > max) {
          let cut = rest.text.length - 1;
          while (cut > 1 && rest.face.font.widthOfTextAtSize(rest.text.slice(0, cut), size) > max) cut--;
          line.push({ text: rest.text.slice(0, cut), face: rest.face });
          push();
          rest = { text: rest.text.slice(cut), face: rest.face };
          w = width(rest, size);
        }
        line.push(rest);
        used += w;
      }
      if (line.length) push();
      return lines;
    };

    const drawLine = (
      line: Run[],
      size: number,
      x: number,
      align: 'left' | 'center' | 'right',
      ink: ReturnType<typeof color>,
      boxWidth: number,
    ) => {
      const total = line.reduce((t, r) => t + width(r, size), 0);
      let cx = align === 'center' ? x + (boxWidth - total) / 2 : align === 'right' ? x + boxWidth - total : x;
      const baseline = y + size;
      mark(cx, cx + total, y, baseline + size * 0.25);
      for (const r of line) {
        if (r.text !== ' ')
          page.drawText(r.text, { x: cx, y: PAGE.height - baseline, size, font: r.face.font, color: ink });
        cx += width(r, size);
      }
    };

    const text = (
      raw: string,
      o: {
        size?: number;
        leading?: number;
        base?: Face;
        bold?: Face;
        align?: 'left' | 'center' | 'right';
        ink?: { r: number; g: number; b: number };
        x?: number;
        width?: number;
        after?: number;
      } = {},
    ) => {
      const size = o.size ?? 10.5;
      const leading = o.leading ?? size * 1.45;
      const x = o.x ?? SAFE.left;
      const w = o.width ?? SAFE.right - SAFE.left;
      for (const line of wrap(runsOf(fill(raw, input.vars), o.base ?? regular, o.bold ?? semibold), size, w)) {
        ensure(leading);
        drawLine(line, size, x, o.align ?? 'left', color(o.ink ?? INK), w);
        y += leading;
      }
      y += o.after ?? 0;
    };

    /**
     * A numbered or bulleted list. Short items (each on one line at half the
     * width) run in two columns, first half on the left, so a list of six
     * tests takes three lines rather than six.
     */
    const list = (items: string[], ordered: boolean) => {
      const indent = 18;
      const gap = 24;
      const half = (SAFE.right - SAFE.left - gap) / 2;
      const short = items.length > 2 || (items.length === 2 && !ordered);
      const twoColumns =
        short && items.every((item) => wrap(runsOf(fill(item, input.vars), regular, semibold), 10.5, half - indent).length === 1);
      const draw = (item: string, i: number, x: number, width: number) => {
        const top = y;
        page.drawText(ordered ? `${i + 1}.` : '•', { x: x + 2, y: PAGE.height - (y + 10.5), size: 10.5, font: regular.font, color: color(INK) });
        mark(x + 2, x + 14, top, top + 13);
        text(item, { x: x + indent, width: width - indent, after: 2 });
      };
      if (twoColumns) {
        const rows = Math.ceil(items.length / 2);
        ensure(rows * (10.5 * 1.45 + 2));
        const start = y;
        items.forEach((item, i) => {
          const col = i < rows ? 0 : 1;
          y = start + (i % rows) * (10.5 * 1.45 + 2);
          draw(item, i, SAFE.left + col * (half + gap), half);
        });
        y = start + rows * (10.5 * 1.45 + 2);
      } else {
        items.forEach((item, i) => {
          ensure(15);
          draw(item, i, SAFE.left, SAFE.right - SAFE.left);
        });
      }
      y += 6;
    };

    /**
     * "Yours in Christ," the Senior Pastors' signature over a rule, then the
     * names. Never split across pages. The signature is drawn as large as the
     * page allows, from 56 pt (the letterhead design) down to 38 pt.
     */
    const SIG = { min: 38, max: 56, rule: 190, leading: 13, space: 6 };
    const signoffHeight = (lines: string[], height = SIG.min) => 10.5 * 1.45 + 2 + height + 6 + lines.length * SIG.leading;
    const signoff = (closing: string, lines: string[]) => {
      ensure(signoffHeight(lines));
      // Whatever room is left goes first to a little space above, then to a larger signature.
      // (Less 3 pt, for the last line's descenders, which hang below its leading.)
      const spare = Math.max(0, SAFE.bottom - y - signoffHeight(lines) - 3);
      const space = Math.min(SIG.space, spare);
      const height = Math.min(SIG.max, SIG.min + spare - space);
      y += space;
      text(closing, { after: 2 });
      const width = height * (signature.width / signature.height);
      page.drawImage(signature, { x: SAFE.left, y: PAGE.height - (y + height), width, height });
      mark(SAFE.left, SAFE.left + width, y, y + height);
      y += height + 2;
      page.drawLine({ start: { x: SAFE.left, y: PAGE.height - y }, end: { x: SAFE.left + SIG.rule, y: PAGE.height - y }, thickness: 0.6, color: color(RULE) });
      mark(SAFE.left, SAFE.left + SIG.rule, y - 1, y + 1);
      y += 4;
      for (const line of lines) {
        if (line === '') y += SIG.leading;
        else text(line, { leading: SIG.leading });
      }
      y += 4;
    };

    const signatureColumns = (columns: { heading: string; subheading: string; fields: string[] }[]) => {
      const gap = 24;
      // One block takes the left half's width plus a little, so the lines are a comfortable length to sign on.
      const colW = columns.length === 1 ? Math.round((SAFE.right - SAFE.left) * 0.6) : (SAFE.right - SAFE.left - gap) / 2;
      const field = { label: 8.5, space: 15 };
      // Measure first, so the two blocks are never split across pages.
      const heights = columns.map((c) => {
        const h = wrap(runsOf(fill(c.heading, input.vars), semibold, semibold), 10, colW).length * 14;
        const s = c.subheading ? wrap(runsOf(fill(c.subheading, input.vars), regular, semibold), 10, colW).length * 14 : 0;
        return h + s + 8 + c.fields.length * (field.label * 1.4 + field.space + 6);
      });
      const height = Math.max(...heights);
      ensure(height);
      const start = y;
      columns.forEach((c, i) => {
        const x = SAFE.left + i * (colW + gap);
        y = start;
        text(c.heading, { size: 10, leading: 14, base: semibold, x, width: colW, ink: BRAND });
        if (c.subheading) text(c.subheading, { size: 10, leading: 14, x, width: colW });
        y += 8;
        for (const f of c.fields) {
          text(f, { size: field.label, leading: field.label * 1.4, x, width: colW, ink: SOFT });
          y += field.space;
          page.drawLine({
            start: { x, y: PAGE.height - y },
            end: { x: x + colW, y: PAGE.height - y },
            thickness: 0.6,
            color: color(RULE),
          });
          mark(x, x + colW, y - 1, y + 1);
          y += 6;
        }
      });
      y = start + height + 10;
    };

    /** Height of a paragraph and of a sign-off, to keep a closing paragraph and the sign-off on one page. */
    const paragraphHeight = (raw: string) => wrap(runsOf(fill(raw, input.vars), regular, semibold), 10.5, SAFE.right - SAFE.left).length * 10.5 * 1.45 + 7;
    const linesHeight = (lines: string[]) => lines.reduce((h, l) => h + (l === '' ? 15 : 10.5 * 1.45), 8);

    input.blocks.forEach((b, i) => {
      const next = input.blocks[i + 1];
      if (b.type === 'paragraph' && (next?.type === 'lines' || next?.type === 'signoff')) {
        const together = paragraphHeight(b.text) + (next.type === 'lines' ? linesHeight(next.lines) : signoffHeight(next.lines));
        if (!fits(together) && together <= SAFE.bottom - SAFE.top) newPage();
      }
      switch (b.type) {
        case 'refLine': {
          ensure(15);
          const size = 9.5;
          const left = wrap(runsOf(fill(b.left, input.vars), regular, semibold), size, 300)[0] ?? [];
          const right = wrap(runsOf(fill(b.right, input.vars), regular, semibold), size, 170)[0] ?? [];
          drawLine(left, size, SAFE.left, 'left', color(SOFT), SAFE.right - SAFE.left);
          drawLine(right, size, SAFE.left, 'right', color(SOFT), SAFE.right - SAFE.left);
          y += 26;
          break;
        }
        case 'title':
          text(b.text, { size: 17, leading: 23, base: serif, bold: serif, align: 'center', ink: BRAND, after: 2 });
          break;
        case 'subtitle':
          text(b.text, { size: 10, leading: 14, base: semibold, align: 'center', ink: SOFT, after: 14 });
          break;
        case 'heading':
          y += 2;
          ensure(15 * 2);
          text(b.text, { base: semibold, ink: BRAND, after: 3 });
          break;
        case 'paragraph':
          text(b.text, { after: 7 });
          break;
        case 'note':
          text(b.text, { size: 9.5, leading: 13.5, base: italic, bold: italic, ink: SOFT, after: 4 });
          break;
        case 'lines':
          for (const line of b.lines) {
            if (line === '') {
              y += 15;
              continue;
            }
            text(line, {});
          }
          y += 8;
          break;
        case 'list':
          list(b.items, b.ordered);
          break;
        case 'testList':
          list(input.tests, true);
          break;
        case 'labList':
          list(
            input.labs.map((l) => [l.name, l.address, l.phone].filter(Boolean).join(', ')),
            false,
          );
          break;
        case 'signatureColumns':
          signatureColumns(b.columns);
          break;
        case 'signoff':
          signoff(b.closing, b.lines);
          break;
        case 'blankLine': {
          // Room to write above a rule; whatever follows sits on the rule's row, right after it.
          const size = 10.5;
          const full = SAFE.right - SAFE.left;
          const after = b.after ? (wrap(runsOf(fill(b.after, input.vars), regular, semibold), size, full)[0] ?? []) : [];
          const afterWidth = after.reduce((t, r) => t + width(r, size), 0);
          const end = Math.min(SAFE.left + b.width * full, SAFE.right - afterWidth - (afterWidth ? 1 : 0));
          ensure(20);
          y += 4;
          const rule = y + size + 2;
          page.drawLine({ start: { x: SAFE.left, y: PAGE.height - rule }, end: { x: end, y: PAGE.height - rule }, thickness: 0.6, color: color(INK) });
          mark(SAFE.left, end, rule - 1, rule + 1);
          if (after.length) drawLine(after, size, end + 1, 'left', color(INK), SAFE.right - end - 1);
          y += size * 1.45 + 2;
          break;
        }
      }
    });

    return { bytes: await doc.save(), pageCount: doc.getPageCount(), bounds };
  }
}
