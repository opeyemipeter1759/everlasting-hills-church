import { z } from 'zod';
import { EMAIL_BODY_MAX, EMAIL_SUBJECT_MAX } from './template-variables';

/**
 * One saved version of a message template, as the editor sends it. The
 * frontend runs the same rules (lib/messages/opening-template.ts). A save is a
 * whole new version. The email words are optional: first-timers are no longer
 * emailed from the Welcome queue, so the editor no longer shows them, and a
 * save without them keeps the ones already there.
 *
 * The WhatsApp length is not capped here on the raw text: the cap is on the
 * message once names are filled in, which the service checks.
 */
export const saveTemplateSchema = z.object({
  whatsappBody: z.string().trim().min(1, 'Write the WhatsApp message').max(2000),
  emailSubject: z.string().trim().max(EMAIL_SUBJECT_MAX).optional(),
  emailBody: z.string().trim().max(EMAIL_BODY_MAX).optional(),
});
export type SaveTemplateInput = z.infer<typeof saveTemplateSchema>;

/** A preview: an unsaved draft (or the active version when left out) filled in for one real first-timer. */
export const previewTemplateSchema = z.object({
  visitorId: z.string().min(1),
  whatsappBody: z.string().max(4000).optional(),
  emailSubject: z.string().max(1000).optional(),
  emailBody: z.string().max(20000).optional(),
});
export type PreviewTemplateInput = z.infer<typeof previewTemplateSchema>;

export const whatsappSentSchema = z.object({
  /** The version the link was rendered from, so the log names what she actually sent. */
  templateVersion: z.number().int().min(1),
});
