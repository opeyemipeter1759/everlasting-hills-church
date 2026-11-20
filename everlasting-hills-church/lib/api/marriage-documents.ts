"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import { api } from "@/lib/api/request";
import type { ReuploadReason, RequirementKind, RequirementStatus } from "@/lib/api/premarital-documents";

/** The marriage team's side of counselling documents. Files open in a new tab, decrypted by the API, never cached. */
export interface RequirementRow {
  id: string;
  kind: RequirementKind;
  status: RequirementStatus;
  uploadedAt: string | null;
  receivedInPersonAt: string | null;
  receivedBy: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  testDate: string | null;
  reuploadReason: ReuploadReason | null;
  storageConsentGiven: boolean | null;
  newUpload: boolean;
  hasFile: boolean;
  fileType: string | null;
  can: { view: boolean; receive: boolean; verify: boolean; reupload: boolean; reopen: boolean };
}
export interface CaseDocuments {
  applicantRole: "GROOM" | "BRIDE" | null;
  validFrom: string;
  requirements: RequirementRow[];
  links: { scope: "ALL" | "GROOM" | "BRIDE"; createdAt: string; expiresAt: string; lastUsedAt: string | null; state: "ACTIVE" | "EXPIRED" | "REVOKED" }[];
  dispatches: { id: string; status: "SENT" | "FAILED" | "SKIPPED"; sentAt: string; automatic: boolean }[];
  storedFiles: number;
  can: { setRole: boolean; send: boolean; reissueLink: boolean; downloadLetters: boolean; deleteStored: boolean };
}

export type LetterKind = "PARENTAL_CONSENT" | "MEDICAL_SCREENING";
export type Block = { type: string; [k: string]: unknown };
export interface LetterTemplate {
  id: string;
  kind: LetterKind;
  version: number;
  approvalState: "DRAFT" | "APPROVED";
  active: boolean;
  createdAt: string;
  approvedAt: string | null;
  body: Block[];
}

type Entry<T> = { value: T; state: "PENDING_PASTORAL_APPROVAL" | "APPROVED" };
export interface DocumentsConfig {
  screeningTests: Entry<string[]>;
  screeningValidityDays: Entry<number>;
  recommendedLabs: Entry<{ name: string; address: string; phone: string }[]>;
  certReturnInstructions: Entry<string>;
  consentReturnInstructions: Entry<string>;
  documentLinkValidDays: Entry<number>;
  documentPageOtp: Entry<boolean>;
  maxUploadMb: Entry<number>;
  sendDocumentsToPartner: Entry<boolean>;
  documentsRequiredBefore: Entry<string>;
  overrideReasons: Entry<{ code: string; label: string }[]>;
  medicalConsentWording: Entry<string>;
  documentRetentionPolicy: Entry<string>;
}

const K = ["marriage"] as const;
export const useCaseDocuments = (id: string) =>
  useQuery({ queryKey: [...K, "documents", id], queryFn: () => api.get<CaseDocuments>(`/premarital/applications/${id}/documents`), enabled: !!id });
export const useLetterTemplates = () =>
  useQuery({ queryKey: [...K, "letters"], queryFn: () => api.get<{ canEdit: boolean; canApprove: boolean; templates: LetterTemplate[] }>("/premarital/document-templates") });
export const useDocumentsConfig = () =>
  useQuery({ queryKey: [...K, "document-settings"], queryFn: () => api.get<{ config: DocumentsConfig; canEdit: boolean }>("/premarital/document-settings") });

/** Opens a blank tab straight away (so it is not blocked), then fills it with the file. */
async function intoNewTab(load: () => Promise<Blob>) {
  const tab = window.open("", "_blank");
  try {
    const blob = await load();
    const href = URL.createObjectURL(blob);
    if (tab) tab.location.href = href;
    else window.location.assign(href);
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

export function openDocument(requirementId: string) {
  return intoNewTab(async () => {
    const { ticket } = await api.post<{ ticket: string }>(`/premarital/documents/${requirementId}/view-ticket`);
    const res = await apiClient.post<Blob>("/premarital/documents/view", { ticket }, { responseType: "blob" });
    return res.data;
  });
}

export function previewLetter(kind: LetterKind, blocks: Block[]) {
  return intoNewTab(async () => (await apiClient.post<Blob>(`/premarital/document-templates/${kind}/preview`, { blocks }, { responseType: "blob" })).data);
}

export function downloadLetter(applicationId: string, which: "consent" | "medical") {
  return intoNewTab(async () => (await apiClient.get<Blob>(`/premarital/applications/${applicationId}/documents/letters/${which}`, { responseType: "blob" })).data);
}
