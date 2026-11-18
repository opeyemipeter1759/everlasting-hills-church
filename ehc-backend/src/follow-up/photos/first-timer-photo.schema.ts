import { z } from 'zod';

/**
 * First-timer photos: the rules both ends follow. The website runs the same
 * checks before it asks for an upload link
 * (everlasting-hills-church/lib/first-timer/photo-schema.ts); keep the two in step.
 *
 * The bucket enforces the same types and size limit itself
 * (scripts/followup-v2/create-photo-bucket.ts), because a signed upload link
 * does not bind what the browser actually sends.
 */
export const PHOTO_BUCKET = 'first-timer-photos';
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/webp', 'image/jpeg', 'image/png'] as const;
export type PhotoType = (typeof PHOTO_TYPES)[number];

/** How long a read link lasts. Long enough to look at a page, short enough that a forwarded link dies. */
export const PHOTO_READ_SECONDS = 10 * 60;

const EXTENSION: Record<PhotoType, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

export const photoUploadSchema = z.object({
  contentType: z.enum(PHOTO_TYPES, { message: 'Only a photo can be attached: WebP, JPEG or PNG' }),
  size: z
    .number({ message: 'The photo size is missing' })
    .int()
    .positive({ message: 'The photo is empty' })
    .max(PHOTO_MAX_BYTES, { message: 'The photo must be 5 MB or smaller' }),
});
export type PhotoUploadRequest = z.infer<typeof photoUploadSchema>;

export const photoConfirmSchema = z.object({
  key: z.string().min(1).max(300),
});

/** Every photo of one first-timer lives under this folder. */
export function photoFolder(tenantId: string, visitorId: string): string {
  return `${tenantId}/first-timers/${visitorId}/`;
}

export function photoKeyFor(tenantId: string, visitorId: string, id: string, type: PhotoType): string {
  return `${photoFolder(tenantId, visitorId)}${id}.${EXTENSION[type]}`;
}

const UUID_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png)$/;

/**
 * True only for a key this API could have issued for this person: their own
 * folder, then one uuid file name. Nothing else (another tenant, another
 * person, `..`, a nested path) passes.
 */
export function isPhotoKeyOf(key: string, tenantId: string, visitorId: string): boolean {
  const folder = photoFolder(tenantId, visitorId);
  return key.startsWith(folder) && UUID_FILE.test(key.slice(folder.length));
}

/** True for any key under this tenant's first-timer photos. */
export function isTenantPhotoKey(key: string, tenantId: string): boolean {
  const prefix = `${tenantId}/first-timers/`;
  if (!tenantId || !key.startsWith(prefix)) return false;
  const [visitorId, file, ...rest] = key.slice(prefix.length).split('/');
  return /^[A-Za-z0-9_-]+$/.test(visitorId ?? '') && rest.length === 0 && UUID_FILE.test(file ?? '');
}
