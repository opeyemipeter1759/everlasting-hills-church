"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./request";

// ── First-timer attendance-type breakdown ─────────────────────────────────────

export interface FirstTimerStats {
  total: number;
  onsite: number;
  online: number;
}

/**
 * Total first-timer registrations broken down by attendance type.
 * Backend endpoint: GET /visitors/stats
 * Returns { total, onsite, online } — counts from the visitor registration form's
 * attendance_type field ("In-Person" → onsite, "Online" → online).
 *
 * This is the source for the First Timer donut chart on the admin dashboard.
 */
export function useFirstTimerStats() {
  return useQuery({
    queryKey: ["visitors", "stats"],
    queryFn: () => api.get<FirstTimerStats>("/visitors/stats"),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

// ── Raw visitor rows (first-timers) ──────────────────────────────────────────

export interface VisitorListRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  submittedAt: string;
}

/**
 * First-timer registrations (the `Visitor` model — a distinct table from
 * `Member`, with no `role` field). Ordered by `submittedAt` desc.
 *
 * "Visitors" and "first-timers" are the same thing in this app — anything
 * asking `/members/directory` for `role: "VISITOR"` will always come back
 * empty, since a Visitor has no Member/Profile record until they convert.
 */
export function useVisitorsList(limit = 1000) {
  return useQuery({
    queryKey: ["visitors", "list", limit],
    queryFn: () => api.get<VisitorListRow[]>("/visitors", { limit }),
    staleTime: 60_000,
  });
}

// ── Pipeline stages (existing endpoint) ──────────────────────────────────────

export interface PipelineStage {
  label: string;
  value: number;
}

/**
 * First-timer pipeline stages from GET /admin/first-timer/pipeline.
 * The first stage ("Registered") represents the all-time total count of
 * first-timer form submissions.
 */
export function useFirstTimerPipeline() {
  return useQuery({
    queryKey: ["visitors", "pipeline"],
    queryFn: () => api.get<PipelineStage[]>("/admin/first-timer/pipeline"),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/** Convenience: derive the all-time total from the pipeline's first stage. */
export function useFirstTimerTotal() {
  const q = useFirstTimerPipeline();
  const total = q.data && q.data.length > 0 ? q.data[0].value : undefined;
  return { ...q, total };
}
