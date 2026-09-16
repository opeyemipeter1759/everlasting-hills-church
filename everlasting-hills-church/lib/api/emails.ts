"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { apiClient } from "@/lib/api/axios";
import type { PersonRole } from "@/lib/api/people";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  /** Per-template salutation; null = the church-wide default. */
  greeting: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFormValues {
  name: string;
  subject: string;
  body: string;
  greeting?: string | null;
}

/** WORKERS = anyone in a unit plus every leader. */
export type AudienceMode = "ALL" | "WORKERS" | "UNIT" | "ROLE" | "SPECIFIC";

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

export interface EmailAttachment {
  name: string;
  url: string;
}

export const MAX_EMAIL_ATTACHMENTS = 5;

export interface EmailSend {
  id: string;
  templateId: string | null;
  subject: string;
  body: string;
  audienceMode: AudienceMode;
  audienceLabel: string;
  recipients: number;
  attachments: EmailAttachment[] | null;
  createdAt: string;
}

export type EmailSettingsPatch = Partial<Pick<EmailSettings, "logoUrl" | "greeting">>;

export interface EmailSettings {
  /** What the admin saved — null means "use the site's default logo". */
  logoUrl: string | null;
  /** What emails actually render with right now. */
  effectiveLogoUrl: string;
  /** Saved salutation word ("Dear", "Hi"…) — null means the default. */
  greeting: string | null;
  /** The word emails actually open with right now, e.g. "Hello" → "Hello Daphne,". */
  effectiveGreeting: string;
  defaultGreeting: string;
}

/**
 * Uploads a file for use in an email (inline image, attachment, or the header
 * logo) and returns its public URL. Images go through the image endpoint;
 * anything else (PDF, Word) through the document one — both land on R2.
 */
export async function uploadEmailFile(file: File): Promise<EmailAttachment> {
  const endpoint = file.type.startsWith("image/") ? "/uploads/image" : "/uploads/document";
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<{ url?: string; imageUrl?: string; name?: string }>(endpoint, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120_000,
  });
  const url = res.data.url ?? res.data.imageUrl ?? "";
  if (!url) throw new Error("Upload did not return a URL");
  return { name: res.data.name ?? file.name, url };
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
    mutationFn: (body: {
      templateId?: string;
      subject: string;
      body: string;
      /** Salutation for this send; null/omitted = the church-wide default. */
      greeting?: string | null;
      audience: AudienceFilter;
      attachments?: EmailAttachment[];
    }) => api.post<EmailSend>("/emails/send", body),
    onSuccess: invalidate,
  });
}

// ── Branding ───────────────────────────────────────────────────────────────

export function useEmailSettings() {
  return useQuery({
    queryKey: [...KEY, "settings"],
    queryFn: () => api.get<EmailSettings>("/emails/settings"),
  });
}

export function useUpdateEmailSettings() {
  const qc = useQueryClient();
  return useMutation({
    // Partial: only the fields you pass are changed; null resets one to its default.
    mutationFn: (body: EmailSettingsPatch) => api.put<EmailSettings>("/emails/settings", body),
    onSuccess: (data) => qc.setQueryData([...KEY, "settings"], data),
  });
}
