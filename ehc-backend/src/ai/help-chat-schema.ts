import { z } from 'zod';

/** The answer shape HillsBot must follow, and its check. */

export const HELP_CHAT_SCHEMA = {
  type: 'object',
  properties: {
    confident: {
      type: 'boolean',
      description: 'true only if this is in scope and you can answer it well; false otherwise',
    },
    heading: {
      type: 'string',
      description:
        'A short lead-in line, tailored to this answer. "Here\'s how it works:" (or any variant) is ONLY for an app-navigation answer — e.g. "A verse worth carrying with you:" for a scripture, "A thought on consecration:" for a faith reflection, "Some books worth exploring:" for a book recommendation. Empty string if not confident.',
    },
    steps: {
      type: 'array',
      items: { type: 'string' },
      description: 'Up to 5 short items — app steps, verses with their reference, short reflections, or book + author + why. Empty array when not confident.',
    },
    ctaLabel: {
      type: 'string',
      description: 'Optional short button label — ONLY for an app-navigation answer (e.g. "Go to today\'s reading"), or a book recommendation linking to the Book Library. Never for a scripture or faith/consecration answer. Empty string if none.',
    },
    ctaHref: { type: 'string', description: 'Optional exact in-app path from the page map, matching ctaLabel\'s rule above. Empty string if none.' },
  },
  required: ['confident', 'heading', 'steps', 'ctaLabel', 'ctaHref'],
};

export const helpChatAnswer = z.object({
  confident: z.boolean(),
  heading: z
    .string()
    .optional()
    .transform((s) => s?.trim() || "Here's what I found:"),
  steps: z
    .array(z.string())
    .default([])
    .transform((steps) => steps.map((s) => s.trim()).filter(Boolean).slice(0, 6)),
  ctaLabel: z
    .string()
    .optional()
    .transform((s) => s?.trim() || undefined),
  // Never trust a model-produced URL as a clickable in-app button unless it's
  // a relative path — guards against it inventing an external link.
  ctaHref: z
    .string()
    .optional()
    .transform((s) => (s?.trim().startsWith('/') ? s.trim() : undefined)),
});
