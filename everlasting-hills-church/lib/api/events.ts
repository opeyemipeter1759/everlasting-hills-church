import { apiClient, type ApiError } from "./axios";

export interface EventRsvpPayload {
  fullName: string;
  email: string;
  phone?: string;
}

/** One RSVP per person — no attendee/party-size count is sent. */
export async function submitEventRsvp(slug: string, payload: EventRsvpPayload): Promise<void> {
  await apiClient.post(`/events/${slug}/rsvp`, payload);
}

/** Logged-in members RSVP with their own account details — the backend looks these up itself. */
export async function submitMemberEventRsvp(slug: string): Promise<void> {
  await apiClient.post(`/events/${slug}/rsvp/me`);
}

/** Source of truth for "am I already registered" — persisted server-side, not browser storage. */
export async function getMyEventRsvpStatus(slug: string): Promise<{ registered: boolean }> {
  const res = await apiClient.get<{ registered: boolean }>(`/events/${slug}/rsvp/me`);
  return res.data;
}

export function getRsvpErrorMessage(err: unknown): string {
  const apiErr = err as Partial<ApiError> | undefined;
  return apiErr?.message ?? "Couldn't send your RSVP. Please try again, or call us directly.";
}
