"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { TBA_DATE, dateParts, type PicnicContent } from "@/components/picnic/picnic-content";
import { picnicPhoto, type PicnicPhotoKey, type ResolvedPhoto } from "@/components/picnic/picnic-photos";

/** The picnic page's CMS content (date, time, venue…); null until it has been published. */
export function usePicnicContent() {
  return useQuery({
    queryKey: ["cms", "picnic"],
    queryFn: () => api.get<{ content: PicnicContent | null }>("/cms/public/picnic").then((r) => r.content ?? null),
    staleTime: 5 * 60_000,
  });
}

/** "Picnic · Saturday, 19 December", or that the date is still to come. */
export function usePicnicDayLabel(): string {
  const { data } = usePicnicContent();
  const { long, when } = dateParts(data?.date);
  return long ? `Picnic · ${when}` : `Picnic: ${TBA_DATE.toLowerCase()}`;
}

/** One picnic photo spot as the CMS has it (the stock photo until a published one replaces it). */
export function usePicnicPhoto(spot: PicnicPhotoKey): ResolvedPhoto {
  const { data } = usePicnicContent();
  return picnicPhoto(data?.photos, spot);
}
