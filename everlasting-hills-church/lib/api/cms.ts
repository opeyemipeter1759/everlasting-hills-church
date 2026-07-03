"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { apiClient } from "@/lib/api/axios";

// ── Types ────────────────────────────────────────────────────────────────────

export type ContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface CmsPageRow {
  key: string;
  title: string;
  route: string;
  group: string;
  featureFlag?: string;
  highImpact?: boolean;
  status: ContentStatus;
  published: boolean;
  updatedAt: string | null;
}

export interface CmsBlock {
  id: string;
  type: string;
  [k: string]: unknown;
}
export interface CmsContent {
  blocks: CmsBlock[];
}

export interface CmsEditorPage {
  def: {
    key: string;
    title: string;
    route: string;
    group: string;
    highImpact?: boolean;
    editor?: "blocks" | "structured";
    contentType?: string;
  };
  page: {
    id: string;
    key: string;
    title: string;
    status: ContentStatus;
    published: boolean;
    publishedVersionId: string | null;
    updatedAt: string;
  };
  // content is { blocks } for block pages, or a structured object for structured pages
  working: { versionId: string | null; version: number; status: ContentStatus; content: unknown };
}

export interface CmsVersion {
  id: string;
  version: number;
  status: ContentStatus;
  publishedAt: string | null;
  publishedBy: string | null;
  createdAt: string;
  createdBy: string | null;
  isLive: boolean;
}

export interface MediaAsset {
  id: string;
  url: string;
  alt: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  createdAt: string;
}

const CMS_KEY = ["cms"] as const;
const enc = (key: string) => encodeURIComponent(key);

// ── Pages ────────────────────────────────────────────────────────────────────

export function useCmsPages() {
  return useQuery({
    queryKey: [...CMS_KEY, "pages"],
    queryFn: () => api.get<CmsPageRow[]>("/cms/pages"),
  });
}

export function useCmsPage(key: string, enabled = true) {
  return useQuery({
    queryKey: [...CMS_KEY, "page", key],
    queryFn: () => api.get<CmsEditorPage>(`/cms/pages/${enc(key)}`),
    enabled: enabled && Boolean(key),
  });
}

export function useCmsVersions(key: string, enabled = true) {
  return useQuery({
    queryKey: [...CMS_KEY, "versions", key],
    queryFn: () =>
      api.get<{ publishedVersionId: string | null; versions: CmsVersion[] }>(
        `/cms/pages/${enc(key)}/versions`,
      ),
    enabled: enabled && Boolean(key),
  });
}

function useInvalidateCms() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: CMS_KEY });
}

export function useSaveDraft(key: string) {
  const invalidate = useInvalidateCms();
  return useMutation({
    // content is { blocks } for block pages, or a structured object for structured pages
    mutationFn: (body: { title?: string; content: unknown }) =>
      api.post(`/cms/pages/${enc(key)}/draft`, body),
    onSuccess: invalidate,
  });
}

export function usePublishPage(key: string) {
  const invalidate = useInvalidateCms();
  return useMutation({
    mutationFn: () => api.post<{ cacheTag: string; route: string }>(`/cms/pages/${enc(key)}/publish`),
    onSuccess: invalidate,
  });
}

export function useUnpublishPage(key: string) {
  const invalidate = useInvalidateCms();
  return useMutation({
    mutationFn: () => api.post(`/cms/pages/${enc(key)}/unpublish`),
    onSuccess: invalidate,
  });
}

export function useRestoreVersion(key: string) {
  const invalidate = useInvalidateCms();
  return useMutation({
    mutationFn: (version: number) => api.post(`/cms/pages/${enc(key)}/versions/${version}/restore`),
    onSuccess: invalidate,
  });
}

export async function mintPreviewToken(key: string) {
  return api.post<{ token: string; expiresAt: string }>(`/cms/pages/${enc(key)}/preview-token`);
}

// ── Media ────────────────────────────────────────────────────────────────────

export function useMedia() {
  return useQuery({
    queryKey: [...CMS_KEY, "media"],
    queryFn: () => api.get<MediaAsset[]>("/cms/media"),
  });
}

export function useUploadMedia() {
  const invalidate = useInvalidateCms();
  return useMutation({
    mutationFn: async (input: { file: File; alt: string; width?: number; height?: number }) => {
      const form = new FormData();
      form.append("file", input.file);
      form.append("alt", input.alt);
      if (input.width) form.append("width", String(input.width));
      if (input.height) form.append("height", String(input.height));
      const res = await apiClient.post<MediaAsset>("/cms/media", form);
      return res.data;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteMedia() {
  const invalidate = useInvalidateCms();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/cms/media/${id}`),
    onSuccess: invalidate,
  });
}

// ── Site-wide settings ─────────────────────────────────────────────────────────

export interface SiteIdentity {
  name: string;
  logoUrl: string;
  faviconUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socials: {
    instagram: string;
    youtube: string;
    facebook: string;
    x: string;
    tiktok: string;
    whatsapp: string;
  };
  mapsEmbedUrl: string;
  footerTagline: string;
  legalLinks: { label: string; href: string }[];
}

export function useSiteConfig() {
  return useQuery({
    queryKey: [...CMS_KEY, "site-config"],
    queryFn: () => api.get<{ content: SiteIdentity; updatedAt: string | null }>("/cms/site-config"),
  });
}

export function useUpdateSiteConfig() {
  const invalidate = useInvalidateCms();
  return useMutation({
    mutationFn: (content: SiteIdentity) =>
      api.put<{ content: SiteIdentity }>("/cms/site-config", content),
    onSuccess: invalidate,
  });
}

// ── Audit ────────────────────────────────────────────────────────────────────

export function useCmsAudit() {
  return useQuery({
    queryKey: [...CMS_KEY, "audit"],
    queryFn: () => api.get<AuditEntry[]>("/cms/audit"),
  });
}
