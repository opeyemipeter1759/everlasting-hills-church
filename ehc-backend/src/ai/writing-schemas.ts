import { z } from 'zod';

/** The answer shapes Gemini must follow for the writing helpers, and their checks. */

export const REWRITE_SCHEMA = {
  type: 'object',
  properties: {
    text: { type: 'string', description: 'The edited text, in the same Markdown subset' },
    notes: { type: 'array', items: { type: 'string' }, description: 'Up to four short notes on the main changes' },
  },
  required: ['text', 'notes'],
};

export const TITLES_SCHEMA = {
  type: 'object',
  properties: {
    titles: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, subtitle: { type: 'string' } },
        required: ['title', 'subtitle'],
      },
    },
  },
  required: ['titles'],
};

/** Strips a code fence the model added anyway, so it never lands in an article. */
function unfence(text: string): string {
  return text.replace(/^```(?:markdown|md)?\s*\n/i, '').replace(/\n```\s*$/i, '');
}

export const rewriteAnswer = z.object({
  text: z.string().max(80_000).transform(unfence),
  notes: z
    .array(z.string())
    .default([])
    .transform((notes) => notes.map((n) => n.trim()).filter(Boolean).slice(0, 4).map((n) => n.slice(0, 160))),
});

export const titlesAnswer = z.object({
  titles: z
    .array(
      z.object({
        title: z.string().trim().min(1).transform((t) => t.replace(/^["“']|["”']$/g, '').slice(0, 160)),
        subtitle: z.string().trim().transform((s) => s.slice(0, 200)),
      }),
    )
    .min(1)
    .transform((t) => t.slice(0, 3)),
});
