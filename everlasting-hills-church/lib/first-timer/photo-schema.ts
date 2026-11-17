import { z } from "zod";

/**
 * The rules for a first-timer photo upload. The API runs the same schema
 * (ehc-backend/src/follow-up/photos/first-timer-photo.schema.ts); keep the
 * two in step. The bucket enforces the type and size limits too.
 */
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;

export const CONSENT_LABEL = "They agreed to this photo being kept on their record";

export const photoUploadSchema = z.object({
  contentType: z.enum(PHOTO_TYPES, { message: "Only a photo can be attached: WebP, JPEG or PNG" }),
  size: z
    .number({ message: "The photo size is missing" })
    .int()
    .positive({ message: "The photo is empty" })
    .max(PHOTO_MAX_BYTES, { message: "The photo must be 5 MB or smaller" }),
  consent: z.literal(true, { message: "Tick that they agreed to this photo being kept on their record" }),
});

export type PhotoUploadRequest = z.infer<typeof photoUploadSchema>;
