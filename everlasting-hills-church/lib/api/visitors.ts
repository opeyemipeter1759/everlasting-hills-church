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
