"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";
import { showToast } from "@/components/ui/toast/toast";
import type { NavGrantType, NavPermissionEntry, NavPermissionGrantEntry } from "@/lib/nav-permissions-core";

export * from "@/lib/nav-permissions-core";

// ── Data fetching ────────────────────────────────────────────────────────────

const KEY = ["nav-permissions"] as const;

/** Every signed-in user needs this to compute their own effective sidebar —
 * not just admins — so it's a plain authenticated read, not ADMIN-gated. */
export function useNavPermissions() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<NavPermissionEntry[]>("/nav-permissions"),
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
  });
}

export function useSaveNavPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: NavPermissionEntry[]) => api.put<NavPermissionEntry[]>("/nav-permissions", { items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      showToast.success("Permissions saved");
    },
    onError: (err) => showToast.error((err as { message?: string })?.message ?? "Couldn't save permissions"),
  });
}

export function useResetNavPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemHref: string) =>
      api.delete<{ itemHref: string; reset: boolean }>(`/nav-permissions?itemHref=${encodeURIComponent(itemHref)}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      showToast.success("Reverted to default");
    },
    onError: (err) => showToast.error((err as { message?: string })?.message ?? "Couldn't reset this item"),
  });
}

// ── Named exceptions (grant-only) ───────────────────────────────────────────

const GRANTS_KEY = ["nav-permissions", "grants"] as const;
const MY_GRANTS_KEY = ["nav-permissions", "my-grants"] as const;

/** Every signed-in user's own set of granted hrefs — self-scoped server-side, so this is safe for any role (unlike the full grants list). */
export function useMyNavGrantedHrefs() {
  return useQuery({
    queryKey: MY_GRANTS_KEY,
    queryFn: () => api.get<{ hrefs: string[] }>("/nav-permissions/my-grants"),
    enabled: typeof window !== "undefined",
    staleTime: 60_000,
    select: (data) => data.hrefs,
  });
}

/** Full named-exceptions list with resolved display names — SUPER_ADMIN only on the backend. */
export function useNavGrants() {
  return useQuery({
    queryKey: GRANTS_KEY,
    queryFn: () => api.get<NavPermissionGrantEntry[]>("/nav-permissions/grants"),
    enabled: typeof window !== "undefined",
  });
}

export function useAddNavGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { itemHref: string; type: NavGrantType; targetId: string }) =>
      api.post<NavPermissionGrantEntry>("/nav-permissions/grants", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GRANTS_KEY });
      qc.invalidateQueries({ queryKey: MY_GRANTS_KEY });
      showToast.success("Exception added");
    },
    onError: (err) => showToast.error((err as { message?: string })?.message ?? "Couldn't add that exception"),
  });
}

export function useRemoveNavGrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string; removed: boolean }>(`/nav-permissions/grants/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GRANTS_KEY });
      qc.invalidateQueries({ queryKey: MY_GRANTS_KEY });
      showToast.success("Exception removed");
    },
    onError: (err) => showToast.error((err as { message?: string })?.message ?? "Couldn't remove that exception"),
  });
}
