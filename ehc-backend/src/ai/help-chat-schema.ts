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
        'A short lead-in line introduced before the list, tailored to this answer — e.g. "Here\'s how it works:", "A verse worth carrying with you:", "A few thoughts on that:", "Some books worth exploring:". Empty string if not confident.',
    },
    steps: {
      type: 'array',
      items: { type: 'string' },
      description: 'Up to 5 short items — app steps, verses with their reference, short reflections, or book + author + why. Empty array when not confident.',
    },
    ctaLabel: { type: 'string', description: 'Optional short button label, e.g. "Go to today\'s reading". Empty string if none.' },
    ctaHref: { type: 'string', description: 'Optional exact in-app path from the page map, e.g. /dashboard/reading. Empty string if none.' },
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
