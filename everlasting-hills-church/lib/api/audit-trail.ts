"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

export interface AuditTarget {
  kind: string;
  name: string;
}

/** A record a service logged while doing it: what the thing looked like before and after. */
export interface AuditRecord {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  at: string;
}

/** One thing someone did. "request": done on the dashboard. "record": logged by the system on its own. */
export interface AuditItem {
  id: string;
  at: string;
  actorId: string | null;
  actorName: string | null;
  kind: "request" | "record";
  area: string;
  summary: string;
  method: string | null;
  targets: AuditTarget[];
  params: Record<string, string> | null;
  body: unknown;
  bodyHidden: boolean;
  records: AuditRecord[];
}

export interface AuditFilters {
  search?: string;
  area?: string;
  actor?: string;
  from?: string;
  to?: string;
}

export interface AuditPage {
  items: AuditItem[];
  nextCursor: string | null;
}

export interface AuditFilterOptions {
  areas: string[];
  people: { userId: string; name: string }[];
}

const clean = (f: AuditFilters) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== ""));

/** The audit trail, newest first, 50 at a time. */
export function useAuditTrail(filters: AuditFilters) {
  const params = clean(filters);
  return useInfiniteQuery({
    queryKey: ["audit-trail", params],
    queryFn: ({ pageParam }) => api.get<AuditPage>("/audit-trail", { ...params, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: "" as string,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

export function useAuditFilterOptions() {
  return useQuery({ queryKey: ["audit-trail", "filters"], queryFn: () => api.get<AuditFilterOptions>("/audit-trail/filters") });
}
