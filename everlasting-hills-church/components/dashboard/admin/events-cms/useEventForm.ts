import { useState } from "react";
import { apiClient } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import type {
  EventDetail,
  EventLocationType,
  EventSchedule,
  EventSection,
  EventStatus,
} from "@/types";
import { toLocalInput } from "./helpers";

export interface EventFormData {
  title: string;
  slug: string;
  tagline: string;
  theme: string;
  shortDescription: string;
  description: string;
  startAt: string;
  endAt: string;
  timezone: string;
  locationType: EventLocationType;
  venueName: string;
  venueAddress: string;
  mapsLink: string;
  flyerImageUrl: string;
  coverImageUrl: string;
  heroImageUrl: string;
  socialImageUrl: string;
  liveUrl: string;
  registrationUrl: string;
  testimonyUrl: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string;
  secondaryCtaLabel: string;
  secondaryCtaUrl: string;
  seoTitle: string;
  seoDescription: string;
  hostName: string;
  guestMinister: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsapp: string;
  status: EventStatus;
  featured: boolean;
  rsvpEnabled: boolean;
  registrationRequired: boolean;
  capacity: string;
  customPath: string;
  order: number;
  schedules: EventSchedule[];
  sections: EventSection[];
}

export type SetField = <K extends keyof EventFormData>(key: K, value: EventFormData[K]) => void;

export function useEventForm(
  initial: EventDetail | null,
  onSaved: () => Promise<void>,
  /** Local `datetime-local` value to seed startAt with when creating from the calendar. */
  defaultStartAt?: string,
) {
  const [data, setData] = useState<EventFormData>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    tagline: initial?.tagline ?? "",
    theme: initial?.theme ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    // An existing event always wins; the calendar default only seeds a fresh create.
    startAt: initial ? toLocalInput(initial.startAt) : (defaultStartAt ?? ""),
    endAt: toLocalInput(initial?.endAt ?? null),
    timezone: initial?.timezone ?? "Africa/Lagos",
    locationType: initial?.locationType ?? "PHYSICAL",
    venueName: initial?.venueName ?? "",
    venueAddress: initial?.venueAddress ?? "",
    mapsLink: initial?.mapsLink ?? "",
    flyerImageUrl: initial?.flyerImageUrl ?? "",
    coverImageUrl: initial?.coverImageUrl ?? initial?.flyerImageUrl ?? "",
    heroImageUrl: initial?.heroImageUrl ?? "",
    socialImageUrl: initial?.socialImageUrl ?? "",
    liveUrl: initial?.liveUrl ?? "",
    registrationUrl: initial?.registrationUrl ?? "",
    testimonyUrl: initial?.testimonyUrl ?? "",
    primaryCtaLabel: initial?.primaryCtaLabel ?? "",
    primaryCtaUrl: initial?.primaryCtaUrl ?? "",
    secondaryCtaLabel: initial?.secondaryCtaLabel ?? "",
    secondaryCtaUrl: initial?.secondaryCtaUrl ?? "",
    seoTitle: initial?.seoTitle ?? "",
    seoDescription: initial?.seoDescription ?? "",
    hostName: initial?.hostName ?? "",
    guestMinister: initial?.guestMinister ?? "",
    contactPhone: initial?.contactPhone ?? "",
    contactEmail: initial?.contactEmail ?? "",
    contactWhatsapp: initial?.contactWhatsapp ?? "",
    status: initial?.status ?? "DRAFT",
    featured: initial?.featured ?? false,
    rsvpEnabled: initial?.rsvpEnabled ?? true,
    registrationRequired: initial?.registrationRequired ?? initial?.rsvpEnabled ?? true,
    capacity: initial?.capacity != null ? String(initial.capacity) : "",
    customPath: initial?.customPath ?? "",
    order: initial?.order ?? 0,
    schedules: initial?.Schedules ?? [],
    sections: initial?.Sections ?? [],
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
      // Send null for cleared optional fields so editing can actually remove a
      // previous value. Nest's IsOptional accepts null and the service stores it.
      const text = (v: string) => (v.trim() ? v.trim() : null);
      const payload = {
        title: data.title.trim(),
        startAt: new Date(data.startAt).toISOString(),
        endAt: data.endAt ? new Date(data.endAt).toISOString() : null,
        status: data.status,
        featured: data.featured,
        rsvpEnabled: data.rsvpEnabled,
        registrationRequired: data.registrationRequired,
        order: Number(data.order) || 0,
        slug: text(data.slug),
        tagline: text(data.tagline),
        theme: text(data.theme),
        shortDescription: text(data.shortDescription),
        description: text(data.description),
        timezone: data.timezone,
        locationType: data.locationType,
        venueName: text(data.venueName),
        venueAddress: text(data.venueAddress),
        mapsLink: text(data.mapsLink),
        flyerImageUrl: text(data.coverImageUrl),
        coverImageUrl: text(data.coverImageUrl),
        heroImageUrl: text(data.heroImageUrl),
        socialImageUrl: text(data.socialImageUrl),
        liveUrl: text(data.liveUrl),
        registrationUrl: text(data.registrationUrl),
        testimonyUrl: text(data.testimonyUrl),
        primaryCtaLabel: text(data.primaryCtaLabel),
        primaryCtaUrl: text(data.primaryCtaUrl),
        secondaryCtaLabel: text(data.secondaryCtaLabel),
        secondaryCtaUrl: text(data.secondaryCtaUrl),
        seoTitle: text(data.seoTitle),
        seoDescription: text(data.seoDescription),
        hostName: text(data.hostName),
        guestMinister: text(data.guestMinister),
        contactPhone: text(data.contactPhone),
        contactEmail: text(data.contactEmail),
        contactWhatsapp: text(data.contactWhatsapp),
        customPath: text(data.customPath),
        schedules: data.schedules.map((schedule, index) => ({
          title: schedule.title.trim(),
          description: text(schedule.description ?? ""),
          startTime: schedule.startTime,
          endTime: text(schedule.endTime ?? ""),
          recurrenceRule: text(schedule.recurrenceRule ?? ""),
          meetingUrl: text(schedule.meetingUrl ?? ""),
          sortOrder: index,
        })),
        sections: data.sections.map((section, index) => ({
          type: section.type,
          title: text(section.title ?? ""),
          subtitle: text(section.subtitle ?? ""),
          content: section.content,
          sortOrder: index,
          isVisible: section.isVisible,
        })),
        capacity: data.capacity.trim() ? Number(data.capacity) : null,
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
