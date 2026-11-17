import { z } from 'zod';
import { EMAIL_BODY_MAX, EMAIL_SUBJECT_MAX } from './template-variables';

/**
 * One saved version of a message template, as the editor sends it. The
 * frontend runs the same rules (lib/messages/opening-template.ts). Every
 * field is required: a save is a whole new version, never a partial edit.
 *
 * The WhatsApp length is not capped here on the raw text: the cap is on the
 * message once names are filled in, which the service checks.
 */
export const saveTemplateSchema = z.object({
  whatsappBody: z.string().trim().min(1, 'Write the WhatsApp message').max(2000),
  emailSubject: z.string().trim().min(1, 'Write an email subject').max(EMAIL_SUBJECT_MAX),
  emailBody: z.string().trim().min(1, 'Write the email').max(EMAIL_BODY_MAX),
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

/** Up to 25 people per bulk email request; the page sends a long list in rounds and shows progress. */
export const BULK_EMAIL_MAX = 25;
export const bulkEmailSchema = z.object({
  visitorIds: z.array(z.string().min(1)).min(1).max(BULK_EMAIL_MAX),
});

export const whatsappSentSchema = z.object({
  /** The version the link was rendered from, so the log names what she actually sent. */
  templateVersion: z.number().int().min(1),
});
