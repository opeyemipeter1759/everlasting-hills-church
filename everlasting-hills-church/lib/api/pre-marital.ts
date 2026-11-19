"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { ApplicationStatus } from "@/lib/pre-marital/schema";

export interface ApplicationSummary {
  id: string;
  referenceCode: string;
  groomFirstName: string;
  groomLastName: string;
  brideFirstName: string;
  brideLastName: string;
  submittedAt: string;
  status: ApplicationStatus;
}

export interface Application extends ApplicationSummary {
  groomPhone: string;
  groomEmail: string;
  groomIsMember: boolean;
  bridePhone: string;
  brideEmail: string;
  brideIsMember: boolean;
  weddingDate: string | null;
  relationshipLength: string | null;
  message: string | null;
  statusUpdatedAt: string | null;
  statusUpdatedById: string | null;
  statusUpdatedByName: string | null;
}

export interface ApplicationList {
  items: ApplicationSummary[];
  counts: Record<ApplicationStatus, number>;
}

/** The public application. Answers with the reference only. */
export function submitPreMaritalApplication(body: object) {
  return api.post<{ referenceCode: string; submittedAt: string }>("/pre-marital-counselling", body);
}

const KEY = ["pastoral", "pre-marital"] as const;

export function usePreMaritalApplications(status?: ApplicationStatus) {
  return useQuery({
    queryKey: [...KEY, "list", status ?? "ALL"],
    queryFn: () => api.get<ApplicationList>("/pre-marital-counselling/applications", status ? { status } : undefined),
  });
}

export function usePreMaritalApplication(id: string) {
  return useQuery({
    queryKey: [...KEY, "one", id],
    queryFn: () => api.get<Application>(`/pre-marital-counselling/applications/${id}`),
    enabled: !!id,
  });
}

export function useUpdatePreMaritalStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: ApplicationStatus) => api.patch<Application>(`/pre-marital-counselling/applications/${id}/status`, { status }),
    onSuccess: (updated) => {
      qc.setQueryData([...KEY, "one", id], updated);
      void qc.invalidateQueries({ queryKey: [...KEY, "list"] });
    },
  });
}
