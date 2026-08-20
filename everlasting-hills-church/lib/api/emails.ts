"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { PersonRole } from "@/lib/api/people";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFormValues {
  name: string;
  subject: string;
  body: string;
}

export type AudienceMode = "ALL" | "UNIT" | "ROLE" | "SPECIFIC";

export interface AudienceFilter {
  mode: AudienceMode;
  unitId?: string;
  role?: PersonRole;
  memberIds?: string[];
}

export const EMPTY_AUDIENCE: AudienceFilter = { mode: "ALL" };

export interface RecipientPreview {
  count: number;
  sample: { name: string; email: string }[];
}

export interface EmailSend {
  id: string;
  templateId: string | null;
  subject: string;
  body: string;
  audienceMode: AudienceMode;
  audienceLabel: string;
  recipients: number;
  createdAt: string;
}

export interface EmailsSentMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmailsSentResponse {
  data: EmailSend[];
  meta: EmailsSentMeta;
}

const KEY = ["emails"] as const;

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

// ── Templates ────────────────────────────────────────────────────────────────

export function useEmailTemplates() {
  return useQuery({
    queryKey: [...KEY, "templates"],
    queryFn: () => api.get<EmailTemplate[]>("/emails/templates"),
  });
}

export function useEmailTemplate(id: string | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "templates", id],
    queryFn: () => api.get<EmailTemplate>(`/emails/templates/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateEmailTemplate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: TemplateFormValues) => api.post<EmailTemplate>("/emails/templates", body),
    onSuccess: invalidate,
  });
}

export function useUpdateEmailTemplate(id: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: TemplateFormValues) => api.patch<EmailTemplate>(`/emails/templates/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useDeleteEmailTemplate() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; deleted: boolean }>(`/emails/templates/${id}`),
    onSuccess: invalidate,
  });
}

// ── Send + history ─────────────────────────────────────────────────────────

export function useEmailsSent(page = 1, limit = 20, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "sent", page, limit],
    queryFn: () => api.get<EmailsSentResponse>("/emails/sent", { page, limit }),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function usePreviewRecipients() {
  return useMutation({
    mutationFn: (audience: AudienceFilter) => api.post<RecipientPreview>("/emails/recipients/preview", audience),
  });
}

export function useSendEmail() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (body: { templateId?: string; subject: string; body: string; audience: AudienceFilter }) =>
      api.post<EmailSend>("/emails/send", body),
    onSuccess: invalidate,
  });
}
