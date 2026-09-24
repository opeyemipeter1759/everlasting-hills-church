"use client";

import { useMe } from "@/lib/api";
import { useFollowUpReportsUnit } from "@/lib/api/follow-up-pipeline";

const CHURCH_WIDE = ["ADMIN", "ADMIN_HEAD", "PASTOR", "SUPER_ADMIN"];

export interface FollowUpLeadership {
  /** Lead of the Follow Up unit itself — not a lead of some other team. */
  isFollowUpLead: boolean;
  /** Head of the department the Follow Up unit sits under. */
  isHod: boolean;
  churchWide: boolean;
  /** Hand a person's follow-up to someone else, and see the unit's report. */
  canRunUnit: boolean;
  /** Approve a status change someone asked for. */
  canApprove: boolean;
}

/**
 * Who may run the Follow Up unit's affairs.
 *
 * The API decides what "lead of Follow Up" means: /follow-up/reports-unit
 * resolves only for that unit's own lead (or anyone church-wide), which is
 * exactly the test we want — leading some other team is not the same thing. A
 * head of department oversees the unit's leads, so they count too.
 */
export function useFollowUpLeadership(): FollowUpLeadership {
  const { data: me } = useMe();
  const { data: reportsUnit } = useFollowUpReportsUnit();

  const churchWide = (me?.effectiveRoles ?? []).some((role) => CHURCH_WIDE.includes(role));
  const isFollowUpLead = !!reportsUnit;
  const isHod = (me?.hodOf ?? []).length > 0;

  return {
    isFollowUpLead,
    isHod,
    churchWide,
    canRunUnit: isFollowUpLead || isHod || churchWide,
    canApprove: isFollowUpLead || isHod || churchWide,
  };
}
