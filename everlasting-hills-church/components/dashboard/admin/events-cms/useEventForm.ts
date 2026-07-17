import { useState } from "react";
import { apiClient } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import type { EventDetail } from "@/types";
import { toLocalInput } from "./helpers";

export interface EventFormData {
  title: string;
  slug: string;
  tagline: string;
  description: string;
  startAt: string;
  endAt: string;
  venueName: string;
  venueAddress: string;
  mapsLink: string;
  flyerImageUrl: string;
  hostName: string;
  guestMinister: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsapp: string;
  status: "DRAFT" | "PUBLISHED";
  featured: boolean;
  rsvpEnabled: boolean;
  capacity: string;
  customPath: string;
  order: number;
}

export type SetField = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) => void;

export function useEventForm(initial: EventDetail | null, onSaved: () => Promise<void>) {
  const [data, setData] = useState<EventFormData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    startAt: toLocalInput(initial?.startAt ?? null),
    endAt: toLocalInput(initial?.endAt ?? null),
    venueName: initial?.venueName ?? "",
    venueAddress: initial?.venueAddress ?? "",
    mapsLink: initial?.mapsLink ?? "",
    flyerImageUrl: initial?.flyerImageUrl ?? "",
    hostName: initial?.hostName ?? "",
    guestMinister: initial?.guestMinister ?? "",
    contactPhone: initial?.contactPhone ?? "",
    contactEmail: initial?.contactEmail ?? "",
    contactWhatsapp: initial?.contactWhatsapp ?? "",
    status: initial?.status ?? "PUBLISHED",
    featured: initial?.featured ?? false,
    rsvpEnabled: initial?.rsvpEnabled ?? true,
    capacity: initial?.capacity != null ? String(initial.capacity) : "",
    customPath: initial?.customPath ?? "",
    order: initial?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initial;
  const set: SetField = (key, value) => setData((d) => ({ ...d, [key]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data.title.trim() || !data.startAt) {
      setError("Title and start date/time are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const text = (v: string) => (v.trim() ? v.trim() : undefined);
      const payload = {
        title: data.title.trim(),
        startAt: new Date(data.startAt).toISOString(),
        endAt: data.endAt ? new Date(data.endAt).toISOString() : undefined,
        status: data.status,
        featured: data.featured,
        rsvpEnabled: data.rsvpEnabled,
        order: Number(data.order) || 0,
        slug: text(data.slug),
        tagline: text(data.tagline),
        description: text(data.description),
        venueName: text(data.venueName),
        venueAddress: text(data.venueAddress),
        mapsLink: text(data.mapsLink),
        flyerImageUrl: text(data.flyerImageUrl),
        hostName: text(data.hostName),
        guestMinister: text(data.guestMinister),
        contactPhone: text(data.contactPhone),
        contactEmail: text(data.contactEmail),
        contactWhatsapp: text(data.contactWhatsapp),
        customPath: text(data.customPath),
        ...(data.capacity.trim() && { capacity: Number(data.capacity) }),
      };
      if (isEdit) {
        await apiClient.patch(`/events/admin/${initial.id}`, payload);
        showToast.success("Event updated");
      } else {
        await apiClient.post("/events/admin", payload);
        showToast.success("Event created");
      }
      await onSaved();
    } catch (err) {
      const e2 = err as { message?: string; details?: { path: string; message: string }[] };
      const detail = e2.details?.[0];
      setError(detail ? `${detail.path}: ${detail.message}` : e2.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return { data, set, saving, error, isEdit, submit };
}
