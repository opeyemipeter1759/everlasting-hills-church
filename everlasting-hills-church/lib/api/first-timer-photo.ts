import axios from "axios";
import { api } from "./request";
import { photoUploadSchema } from "@/lib/first-timer/photo-schema";

interface UploadLink {
  uploadUrl: string;
  headers: Record<string, string>;
  key: string;
}

const photoPath = (visitorId: string) => `/follow-up/first-timers/${encodeURIComponent(visitorId)}/photo`;

/**
 * Attaches a photo, already resized, to a first-timer's record.
 *
 * The API issues a one-time link and the browser sends the photo straight to
 * private storage, so it never passes through our servers. The photo goes on
 * their record only once the API has confirmed the upload arrived.
 */
export async function uploadFirstTimerPhoto(visitorId: string, photo: Blob): Promise<void> {
  const checked = photoUploadSchema.safeParse({ contentType: photo.type, size: photo.size });
  if (!checked.success) throw new Error(checked.error.issues[0]?.message ?? "This photo cannot be attached");

  const link = await api.post<UploadLink>(`${photoPath(visitorId)}/upload-url`, checked.data);
  try {
    // A bare axios call, not apiClient: this goes to storage, not our API, and must not carry our cookies.
    await axios.put(link.uploadUrl, photo, { headers: link.headers, withCredentials: false, timeout: 60_000 });
  } catch {
    throw new Error("The photo did not upload. Check your connection and try again.");
  }
  await api.post(photoPath(visitorId), { key: link.key });
}

/** Takes the photo off their record and out of storage. */
export function removeFirstTimerPhoto(visitorId: string) {
  return api.delete<{ removed: boolean }>(photoPath(visitorId));
}

/** The message to show for any failure here, whether ours or the API's. */
export function photoErrorMessage(err: unknown): string {
  const message = (err as { message?: unknown } | null)?.message;
  return typeof message === "string" && message ? message : "Something went wrong with the photo. Try again.";
}
