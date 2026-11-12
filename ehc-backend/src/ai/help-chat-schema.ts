import { z } from 'zod';

/** The answer shape HillsBot must follow, and its check. */

export const HELP_CHAT_SCHEMA = {
  type: 'object',
  properties: {
    confident: {
      type: 'boolean',
      description: 'true only if the page map below answers this specifically and accurately; false otherwise',
    },
    steps: {
      type: 'array',
      items: { type: 'string' },
      description: 'Up to 5 short, concrete steps. Empty array when not confident.',
    },
    ctaLabel: { type: 'string', description: 'Optional short button label, e.g. "Go to today\'s reading". Empty string if none.' },
    ctaHref: { type: 'string', description: 'Optional exact in-app path from the page map, e.g. /dashboard/reading. Empty string if none.' },
  },
  required: ['confident', 'steps', 'ctaLabel', 'ctaHref'],
};

export const helpChatAnswer = z.object({
  confident: z.boolean(),
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
