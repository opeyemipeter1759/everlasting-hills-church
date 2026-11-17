"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import type { ApiError } from "@/lib/api/axios";
import { showToast } from "@/components/ui/toast/toast";
import type { CreateRoutingRuleInput, UpdateRoutingRuleInput } from "@/lib/follow-up/routing-schema";

export interface RoutingRule {
  id: string;
  name: string;
  segment: string;
  unitId: string;
  unitName: string | null;
  strategy: string;
  priority: number;
  active: boolean;
  pool: { memberId: string; name: string; active: boolean; openLoad: number }[];
}

export interface RoutingOptions {
  units: { id: string; name: string; members: { id: string; name: string }[] }[];
}

const KEY = ["routing-rules"] as const;

export function useRoutingRules() {
  return useQuery({ queryKey: KEY, queryFn: () => api.get<RoutingRule[]>("/routing-rules"), enabled: typeof window !== "undefined" });
}

export function useRoutingOptions() {
  return useQuery({
    queryKey: [...KEY, "options"],
    queryFn: () => api.get<RoutingOptions>("/routing-rules/options"),
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
  });
}

/** Add a rule, or change one (only the fields sent change). */
export function useSaveRoutingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; create?: CreateRoutingRuleInput; update?: UpdateRoutingRuleInput }) =>
      input.id ? api.patch<RoutingRule[]>(`/routing-rules/${input.id}`, input.update) : api.post<RoutingRule[]>("/routing-rules", input.create),
    onSuccess: (rules) => {
      qc.setQueryData(KEY, rules);
      showToast.success("Routing rule saved");
    },
    onError: (err) => showToast.error((err as ApiError)?.message || "Could not save the rule"),
  });
}
