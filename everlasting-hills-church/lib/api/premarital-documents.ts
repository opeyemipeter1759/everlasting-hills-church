"use client";

import { apiClient } from "@/lib/api/axios";

/**
 * The couple's documents page. No account: the link token goes to the API in
 * a request body (never a URL), and the session lives in an httpOnly cookie
 * the proxy passes only to these routes. Nothing here ever downloads a file.
 */
export type RequirementKind = "PARENTAL_CONSENT" | "MEDICAL_CERT_GROOM" | "MEDICAL_CERT_BRIDE";
export type RequirementStatus = "PENDING" | "UPLOADED" | "RECEIVED_IN_PERSON" | "VERIFIED" | "NEEDS_REUPLOAD";
export type ReuploadReason = "UNREADABLE" | "INCOMPLETE" | "WRONG_DOCUMENT" | "OUTSIDE_VALIDITY_WINDOW" | "MISSING_SIGNATURE" | "OTHER";

export interface CoupleDocument {
  kind: RequirementKind;
  label: string;
  status: RequirementStatus;
  reuploadReason: ReuploadReason | null;
  canUpload: boolean;
  needsConsent: boolean;
}
export interface CouplePage {
  firstNames: string[];
  reference: string;
  maxUploadMb: number;
  medicalConsentWording: string;
  documents: CoupleDocument[];
}

const BASE = "/public/premarital/documents";

export const STATUS_WORDS: Record<RequirementStatus, string> = {
  PENDING: "Not uploaded",
  UPLOADED: "Uploaded, awaiting review",
  RECEIVED_IN_PERSON: "Received in person",
  VERIFIED: "Accepted",
  NEEDS_REUPLOAD: "Please upload again",
};

export const REASON_WORDS: Record<ReuploadReason, string> = {
  UNREADABLE: "We could not read it clearly. A sharper photo or scan will help.",
  INCOMPLETE: "Part of the document is missing.",
  WRONG_DOCUMENT: "This is not the document we asked for.",
  OUTSIDE_VALIDITY_WINDOW: "The test date is outside the accepted window. Please test again and upload the new certificate.",
  MISSING_SIGNATURE: "A signature is missing.",
  OTHER: "Please contact the church office for details.",
};

export async function exchangeToken(token: string): Promise<"CODE" | "READY"> {
  const res = await apiClient.post<{ stage: "CODE" | "READY" }>(`${BASE}/access`, { token });
  return res.data.stage;
}
export const sendCode = () => apiClient.post(`${BASE}/code`, {}).then(() => undefined);
export const verifyCode = (code: string) => apiClient.post(`${BASE}/code/verify`, { code }).then(() => undefined);
export const loadPage = () => apiClient.get<CouplePage>(BASE).then((r) => r.data);
export const recordConsent = (kind: RequirementKind) => apiClient.post(`${BASE}/consent`, { kind }).then(() => undefined);
export const signOut = () => apiClient.post(`${BASE}/sign-out`, {}).then(() => undefined);

export function uploadDocument(kind: RequirementKind, file: File, onProgress: (percent: number) => void) {
  const body = new FormData();
  body.append("file", file);
  return apiClient
    .post(`${BASE}/${kind}/upload`, body, {
      onUploadProgress: (e) => e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
    })
    .then(() => undefined);
}
