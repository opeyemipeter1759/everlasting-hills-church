"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { PipelineRow } from "@/lib/api/pipeline";
import { OPENING_KEY, type TemplateDraft } from "@/lib/messages/opening-template";

export interface TemplateVersion extends TemplateDraft {
  version: number;
  editedById: string | null;
  editedByName: string | null;
  createdAt: string;
  active: boolean;
}

export interface TemplateHistory {
  key: string;
  active: TemplateVersion | null;
  versions: TemplateVersion[];
  church: { churchName: string; serviceTimes: string };
}

export interface OpeningWhatsApp {
  text: string;
  link: string;
  templateVersion: number;
}

export interface OpeningSend {
  id: string;
  channel: "whatsapp" | "email";
  templateVersion: number;
  status: "SENT" | "PENDING" | "FAILED" | "SKIPPED";
  error: string | null;
  sentAt: string;
  automatic: boolean;
  sentByName: string | null;
}

export interface OpeningContext {
  canSend: boolean;
  template: { key: string; version: number } | null;
  whatsapp: OpeningWhatsApp | null;
  sends: OpeningSend[];
}

export interface OpeningQueue {
  windowDays: number;
  template: { key: string; version: number } | null;
  total: number;
  rows: { person: PipelineRow; whatsapp: OpeningWhatsApp | null }[];
}

export interface TemplatePreview {
  person: { visitorId: string; firstName: string; lastName: string };
  whatsapp: { text: string; length: number };
  email: { subject: string; text: string; html: string };
}

const TEMPLATE_KEY = ["message-templates", OPENING_KEY] as const;

/** Under "follow-up" so the profile's refresh (and every send) re-reads these with the lists and counts. */
const OPENING = ["follow-up", "opening"] as const;

export function useOpeningTemplate() {
  return useQuery({
    queryKey: TEMPLATE_KEY,
    queryFn: () => api.get<TemplateHistory>(`/message-templates/${OPENING_KEY}`),
    enabled: typeof window !== "undefined",
  });
}

function useAfterTemplateChange() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: TEMPLATE_KEY });
    qc.invalidateQueries({ queryKey: OPENING });
  };
}

export function useSaveOpeningTemplate() {
  const after = useAfterTemplateChange();
  return useMutation({
    mutationFn: (draft: TemplateDraft) => api.post<TemplateVersion>(`/message-templates/${OPENING_KEY}`, draft),
    onSuccess: after,
  });
}

export function useRevertOpeningTemplate() {
  const after = useAfterTemplateChange();
  return useMutation({
    mutationFn: (version: number) => api.post<TemplateVersion>(`/message-templates/${OPENING_KEY}/versions/${version}/revert`),
    onSuccess: after,
  });
}

/** A draft filled in for one real first-timer. Pass an already debounced draft. */
export function useOpeningPreview(visitorId: string | null, draft: TemplateDraft) {
  return useQuery({
    queryKey: [...TEMPLATE_KEY, "preview", visitorId, draft],
    queryFn: () => api.post<TemplatePreview>(`/message-templates/${OPENING_KEY}/preview`, { visitorId, ...draft }),
    enabled: !!visitorId && typeof window !== "undefined",
    placeholderData: (previous) => previous,
  });
}

export function useOpeningQueue() {
  return useQuery({
    queryKey: [...OPENING, "queue"],
    queryFn: () => api.get<OpeningQueue>("/opening-message/queue"),
    enabled: typeof window !== "undefined",
  });
}

export function useOpeningContext(visitorId: string) {
  return useQuery({
    queryKey: [...OPENING, visitorId],
    queryFn: () => api.get<OpeningContext>(`/opening-message/first-timers/${visitorId}`),
    enabled: !!visitorId && typeof window !== "undefined",
  });
}

/** Logs a WhatsApp send as she taps; the link itself opens WhatsApp. */
export function useLogWhatsAppSend() {
  return useMutation({
    mutationFn: ({ visitorId, templateVersion }: { visitorId: string; templateVersion: number }) =>
      api.post<{ logged: boolean; firstContact: boolean }>(`/opening-message/first-timers/${visitorId}/whatsapp`, { templateVersion }),
  });
}

