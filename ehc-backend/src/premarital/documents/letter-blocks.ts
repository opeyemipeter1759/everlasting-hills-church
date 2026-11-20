import type { CounsellingLetterKind } from '@prisma/client';
import { z } from 'zod';

/**
 * Letter wording as structured blocks: never HTML, never free layout. The
 * renderer decides how each block looks; the pastors decide only the words.
 * Text may use **bold** and the placeholders below, nothing else.
 */
export const PLACEHOLDERS = [
  'applicationRef',
  'issueDate',
  'groomName',
  'brideName',
  'applicationDate',
  'validFromDate',
  'returnInstructions',
] as const;
export type Placeholder = (typeof PLACEHOLDERS)[number];
export type LetterVars = Record<Placeholder, string>;

const PLACEHOLDER = /\{([^{}]*)\}/g;

/** Unknown placeholders, or stray braces, in one piece of text. */
export function placeholderProblems(text: string): string[] {
  const problems: string[] = [];
  for (const m of text.matchAll(PLACEHOLDER)) {
    if (!(PLACEHOLDERS as readonly string[]).includes(m[1])) problems.push(`{${m[1]}}`);
  }
  const stripped = text.replace(PLACEHOLDER, '');
  if (/[{}]/.test(stripped)) problems.push('a stray { or }');
  return problems;
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .min(1, 'This line cannot be empty')
    .max(max, `Keep this under ${max} characters`)
    .superRefine((v, ctx) => {
      const bad = placeholderProblems(v);
      if (bad.length)
        ctx.addIssue({
          code: 'custom',
          message: `Only these placeholders work: ${PLACEHOLDERS.map((p) => `{${p}}`).join(', ')}. Found ${bad.join(', ')}.`,
        });
    });
const optionalLine = z
  .string()
  .trim()
  .max(200)
  .superRefine((v, ctx) => {
    const bad = placeholderProblems(v);
    if (bad.length) ctx.addIssue({ code: 'custom', message: `Unknown placeholder ${bad.join(', ')}` });
  });

export const blockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('refLine'), left: text(200), right: text(200) }),
  z.object({ type: z.literal('title'), text: text(120) }),
  z.object({ type: z.literal('subtitle'), text: text(200) }),
  z.object({ type: z.literal('heading'), text: text(200) }),
  z.object({ type: z.literal('paragraph'), text: text(2000) }),
  z.object({ type: z.literal('note'), text: text(1000) }),
  /** Lines with no space between them: an address, a sign-off. An empty string is a blank line. */
  z.object({ type: z.literal('lines'), lines: z.array(optionalLine).min(1).max(12) }),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(text(300)).min(1).max(20) }),
  /** The screening tests from the settings, numbered. */
  z.object({ type: z.literal('testList') }),
  /** The recommended laboratories from the settings. */
  z.object({ type: z.literal('labList') }),
  /** The consent letter's two signature blocks, side by side. */
  z.object({
    type: z.literal('signatureColumns'),
    columns: z
      .array(
        z.object({
          heading: text(120),
          subheading: optionalLine,
          fields: z.array(text(80)).min(1).max(8),
        }),
      )
      .length(2),
  }),
]);
export type Block = z.infer<typeof blockSchema>;
export const blocksSchema = z.array(blockSchema).min(1).max(60);

/** Every piece of text in a letter, for checks. */
export function textsOf(blocks: Block[]): string[] {
  return blocks.flatMap((b) => {
    switch (b.type) {
      case 'refLine':
        return [b.left, b.right];
      case 'lines':
        return b.lines;
      case 'list':
        return b.items;
      case 'signatureColumns':
        return b.columns.flatMap((c) => [c.heading, c.subheading, ...c.fields]);
      case 'testList':
      case 'labList':
        return [];
      default:
        return [b.text];
    }
  });
}

/** Puts the values in. Throws if anything in braces is left, so a half-filled letter is never sent. */
export function fill(text: string, vars: LetterVars): string {
  const out = text.replace(PLACEHOLDER, (whole, key: string) =>
    (PLACEHOLDERS as readonly string[]).includes(key) ? vars[key as Placeholder] : whole,
  );
  if (/[{}]/.test(out)) throw new Error('A letter still has an unfilled placeholder');
  return out;
}

const REF = { type: 'refLine', left: 'Ref: EHC/MFM/PMC/{applicationRef}', right: 'Date: {issueDate}' } as const;

/** Version 1, word for word from the brief (DRAFT, PENDING_PASTORAL_APPROVAL). */
export const SEED_BODIES: Record<CounsellingLetterKind, Block[]> = {
  PARENTAL_CONSENT: [
    REF,
    { type: 'title', text: 'PARENTAL CONSENT AND BLESSING' },
    { type: 'subtitle', text: 'Marriage & Family Ministry, Pre-Marital Counselling' },
    { type: 'lines', lines: ['To the Pastor,', 'Everlasting Hills Church'] },
    {
      type: 'paragraph',
      text: 'We, the undersigned, being a parent or guardian of the intending groom, **{groomName}**, and a parent or guardian of the intending bride, **{brideName}**, confirm that we are aware of their intention to be joined together in marriage.',
    },
    {
      type: 'paragraph',
      text: 'We give our consent and blessing to this union, and we support their participation in the Pre-Marital Counselling programme of Everlasting Hills Church as they prepare for a marriage that honours God.',
    },
    {
      type: 'signatureColumns',
      columns: [
        {
          heading: 'Parent / Guardian of the Intending Groom',
          subheading: '({groomName})',
          fields: ['Full name', 'Relationship to the intending groom', 'Phone', 'Signature', 'Date'],
        },
        {
          heading: 'Parent / Guardian of the Intending Bride',
          subheading: '({brideName})',
          fields: ['Full name', 'Relationship to the intending bride', 'Phone', 'Signature', 'Date'],
        },
      ],
    },
    {
      type: 'note',
      text: 'Where a parent is deceased or unavailable, a guardian or recognised family representative may sign and state their relationship. {returnInstructions}',
    },
  ],
  MEDICAL_SCREENING: [
    REF,
    { type: 'title', text: 'PRE-MARITAL MEDICAL SCREENING REQUIREMENT' },
    { type: 'paragraph', text: 'Dear {groomName} and {brideName},' },
    {
      type: 'paragraph',
      text: 'Thank you for applying for Pre-Marital Counselling at Everlasting Hills Church. As part of your preparation, **each of you** is required to complete the medical screening below and submit your medical screening certificate. Your counselling cannot be completed until both certificates have been received.',
    },
    { type: 'heading', text: 'Required tests (for both the intending groom and the intending bride)' },
    { type: 'testList' },
    { type: 'heading', text: 'Validity' },
    {
      type: 'paragraph',
      text: 'Tests must be carried out within one month of your application date ({applicationDate}). We cannot accept results dated before {validFromDate}.',
    },
    { type: 'heading', text: 'Where to test' },
    {
      type: 'paragraph',
      text: 'You may use any licensed hospital or diagnostic laboratory. For convenience, we recommend:',
    },
    { type: 'labList' },
    {
      type: 'paragraph',
      text: 'Everlasting Hills Church has no partnership or commercial arrangement with these facilities, and you are free to use any licensed facility of your choice.',
    },
    { type: 'heading', text: 'Submission and confidentiality' },
    { type: 'paragraph', text: '{returnInstructions}' },
    {
      type: 'paragraph',
      text: "Your results will be treated as strictly confidential and seen only by the pastorate of Everlasting Hills Church. The church will not share one partner's results with the other. We encourage you to share your results with each other openly, as an act of trust. Where needed, your pastor will meet with you privately and may recommend further medical advice.",
    },
    { type: 'lines', lines: ['Yours in Christ,', '', '', '____________________', 'Marriage & Family Ministry', 'Everlasting Hills Church'] },
  ],
};
