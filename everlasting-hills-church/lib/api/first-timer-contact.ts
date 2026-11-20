"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/request";

/**
 * First-Timer Contact is global and unscoped like Head Usher, backed by its own
 * FirstTimerContactAssignment table. It opens the first-timer pages and the
 * opening message tools, nothing more.
 */
function useInvalidateRoles() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["people"] });
    qc.invalidateQueries({ queryKey: ["users"] });
  };
}

export function useAssignFirstTimerContact() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (profileId: string) => api.post(`/users/${profileId}/first-timer-contact`),
    onSuccess: invalidate,
  });
}

export function useRemoveFirstTimerContact() {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (profileId: string) => api.delete(`/users/${profileId}/first-timer-contact`),
    onSuccess: invalidate,
  });
}

/** Marriage Ministry: the same shape, backed by MarriageMinistryAssignment. */
export function useAssignMarriageMinistry() {
  const invalidate = useInvalidateRoles();
  return useMutation({ mutationFn: (profileId: string) => api.post(`/users/${profileId}/marriage-ministry`), onSuccess: invalidate });
}

export function useRemoveMarriageMinistry() {
  const invalidate = useInvalidateRoles();
  return useMutation({ mutationFn: (profileId: string) => api.delete(`/users/${profileId}/marriage-ministry`), onSuccess: invalidate });
}

type Holder = { profileId: string; member: { firstName: string; lastName: string; photoUrl: string | null } | null };

export function marriageMinistryHolders(byRole: object | undefined): Holder[] {
  return ((byRole as Record<string, Holder[] | undefined> | undefined)?.MARRIAGE_MINISTRY ?? []) as Holder[];
}

/** The people who hold First-Timer Contact, from the roles-by-person list (empty until the API lists the role). */
export function firstTimerContactHolders(byRole: object | undefined): Holder[] {
  return ((byRole as Record<string, Holder[] | undefined> | undefined)?.FIRST_TIMER_CONTACT ?? []) as Holder[];
}
