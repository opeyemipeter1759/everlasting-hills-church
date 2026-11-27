"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/axios";
import { api } from "@/lib/api/request";
import type { Edition, ProgramAccent, ProgramCadence, ProgramType } from "@/lib/programs";

export type ProgramStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface AdminProgramRow {
  id: string;
  slug: string;
  name: string;
  status: ProgramStatus;
  featured: boolean;
  sortOrder: number;
  cadence: ProgramCadence;
  programType: ProgramType;
  accent: ProgramAccent;
  logoUrl: string | null;
  shortDescription: string;
  eyebrow: string;
  schedule: string;
  attention: string[];
  updatedAt: string;
}

/** The fields the form edits directly; the API changes only those sent. */
export interface ProgramFields {
  slug: string;
  name: string;
  nameStatus: "FINAL" | "PROVISIONAL";
  eyebrow: string | null;
  shortDescription: string;
  longDescription: string | null;
  programType: ProgramType;
  cadence: ProgramCadence;
  recurrenceRule: string | null;
  startTime: string | null;
  durationMinutes: number | null;
  startOffsetDays: number;
  timezone: string;
  dateStatus: "CONFIRMED" | "TBA";
  format: "IN_PERSON" | "ONLINE" | "HYBRID";
  venue: string | null;
  streamUrl: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  accent: ProgramAccent;
  ctaLabel: string | null;
  ctaUrl: string | null;
  featured: boolean;
}

export interface AdminScripture {
  reference: string;
  status: "CONFIRMED" | "SUGGESTED";
  text?: string | null;
  translation?: string | null;
}
export interface AdminSession {
  name: string;
  startTime: string;
  endTime: string;
  description: string | null;
}

export interface AdminProgram extends ProgramFields {
  id: string;
  status: ProgramStatus;
  scriptures: AdminScripture[];
  sessions: AdminSession[];
  editions: Edition[];
  schedule: string;
  generatedEyebrow: string;
  next: { start: string; end: string; label: string | null }[];
  attention: string[];
  updatedAt: string;
}

const K = ["programs-admin"] as const;

export const usePrograms = () => useQuery({ queryKey: [...K, "list"], queryFn: () => api.get<AdminProgramRow[]>("/programs") });
export const useProgram = (id: string) => useQuery({ queryKey: [...K, "one", id], queryFn: () => api.get<AdminProgram>(`/programs/${id}`), enabled: !!id });
export const useBibleBooks = () =>
  useQuery({ queryKey: [...K, "books"], queryFn: () => api.get<{ id: number; name: string; chapterCount: number }[]>("/programs/bible-books"), staleTime: Infinity });

/** Any change to a program: send it, then refresh the list and that program. */
export function useProgramAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ method, path, body }: { method: "post" | "patch" | "put" | "delete"; path: string; body?: object }) =>
      method === "delete" ? api.delete<AdminProgram>(path) : api[method]<AdminProgram>(path, body ?? {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: K }),
  });
}

/** Reorder shown at once; put back if the server refuses. */
export function useReorder() {
  const qc = useQueryClient();
  const key = [...K, "list"];
  return useMutation({
    mutationFn: (ids: string[]) => api.patch<AdminProgramRow[]>("/programs/order", { ids }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData<AdminProgramRow[]>(key);
      if (before) qc.setQueryData(key, ids.map((id) => before.find((r) => r.id === id)).filter(Boolean));
      return { before };
    },
    onError: (_err, _ids, ctx) => ctx?.before && qc.setQueryData(key, ctx.before),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function previewSchedule(body: Pick<ProgramFields, "cadence" | "programType" | "recurrenceRule" | "startTime" | "durationMinutes" | "startOffsetDays" | "dateStatus">) {
  return api.post<{ schedule: string; eyebrow: string; next: { start: string; end: string }[] }>("/programs/schedule-preview", body);
}

export function checkScripture(reference: string) {
  return api.get<{ reference: string; text: string | null; translation: string | null }>("/programs/scripture-check", { reference });
}

/** Logo or cover: stored in R2 by the existing upload endpoint, which returns its public URL. */
export async function uploadProgramImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await apiClient.post<{ url?: string; imageUrl?: string }>("/uploads/image", fd, { headers: { "Content-Type": undefined as unknown as string }, timeout: 120_000 });
  const url = res.data.url ?? res.data.imageUrl;
  if (!url) throw new Error("The upload did not return an address");
  return url;
}
