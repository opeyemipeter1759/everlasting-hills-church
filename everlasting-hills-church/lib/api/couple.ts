"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import { api } from "@/lib/api/request";

/**
 * The couple dashboard (pre-marital counselling): each partner's own view of
 * their application. Both partners use the same routes; the API finds the
 * application by who is signed in. Nothing here ever downloads an uploaded file.
 */
export type RequirementKind = "PARENTAL_CONSENT" | "MEDICAL_CERT_GROOM" | "MEDICAL_CERT_BRIDE";
export type RequirementStatus = "PENDING" | "UPLOADED" | "RECEIVED_IN_PERSON" | "VERIFIED" | "NEEDS_REUPLOAD";
export type ReuploadReason = "UNREADABLE" | "INCOMPLETE" | "WRONG_DOCUMENT" | "OUTSIDE_VALIDITY_WINDOW" | "MISSING_SIGNATURE" | "OTHER";
type Role = "GROOM" | "BRIDE" | null;

export interface CoupleDocument {
  kind: RequirementKind;
  label: string;
  status: RequirementStatus;
  /** This partner may upload it: the consent letter, or their own certificate. */
  yours: boolean;
  reuploadReason: ReuploadReason | null;
  canUpload: boolean;
  needsConsent: boolean;
}
export interface CoupleSession {
  id: string;
  scheduledAt: string;
  durationMinutes: number;
  format: "PHYSICAL" | "ONLINE";
  location: string | null;
  meetingLink: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  topic: string | null;
  counsellor: string | null;
}
export interface CoupleMaterial {
  id: string;
  title: string;
  description: string | null;
  scriptureRefs: string[];
  objectives: string[];
  resources: { label: string; url: string }[];
  completed: boolean;
}
export interface CoupleOverview {
  application: {
    reference: string;
    status: string;
    message: string;
    closed: boolean;
    submittedAt: string;
    weddingDate: string | null;
    you: { firstName: string; role: Role };
    partner: { firstName: string; role: Role };
    stages: { label: string; state: "DONE" | "CURRENT" | "UPCOMING" }[];
  };
  counsellors: { name: string; lead: boolean }[];
  sessions: CoupleSession[];
  materials: CoupleMaterial[];
  documents: {
    uploadsOpen: boolean;
    maxUploadMb: number;
    medicalConsentWording: string;
    neededBefore: string | null;
    lettersAvailable: boolean;
    items: CoupleDocument[];
  };
}

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

const BASE = "/counselling/me";
export const COUPLE_KEY = ["couple"] as const;

export const useCoupleOverview = () => useQuery({ queryKey: [...COUPLE_KEY, "overview"], queryFn: () => api.get<CoupleOverview>(BASE), retry: false });

export const recordConsent = (kind: RequirementKind) => api.post(`${BASE}/documents/consent`, { kind }).then(() => undefined);

export function uploadDocument(kind: RequirementKind, file: File, onProgress: (percent: number) => void) {
  const body = new FormData();
  body.append("file", file);
  return apiClient
    .post(`${BASE}/documents/${kind}/upload`, body, {
      onUploadProgress: (e) => e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
    })
    .then(() => undefined);
}

/** Saves one of the two letters as a PDF. */
export async function downloadLetter(which: "consent" | "medical") {
  const { data } = await apiClient.get<Blob>(`${BASE}/letters/${which}`, { responseType: "blob" });
  const href = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = href;
  a.download = which === "consent" ? "Parental-Consent.pdf" : "Medical-Screening-Requirement.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 60_000);
}
