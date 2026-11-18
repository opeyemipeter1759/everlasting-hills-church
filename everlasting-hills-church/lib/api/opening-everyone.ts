"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { PipelineRow } from "@/lib/api/pipeline";
import type { OpeningWhatsApp } from "@/lib/api/opening-message";

/** Every first-timer ever, newest first, each with a ready WhatsApp link: the Welcome queue's "All first-timers". */
export interface OpeningEveryone {
  template: { key: string; version: number } | null;
  total: number;
  rows: { person: PipelineRow; whatsapp: OpeningWhatsApp | null; lastWhatsApp: { sentAt: string; sentByName: string | null } | null }[];
}

export function useOpeningEveryone(q: { search?: string; take: number; skip: number }) {
  const params = Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== ""));
  return useQuery({
    queryKey: ["follow-up", "opening", "everyone", params],
    queryFn: () => api.get<OpeningEveryone>("/opening-message/everyone", params),
    enabled: typeof window !== "undefined",
    placeholderData: (previous) => previous,
  });
}
