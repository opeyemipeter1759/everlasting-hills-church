import { useState } from "react";
import type { WelfareRequestRow, WelfareStatus } from "@/lib/api/welfare";
import { groupByDay } from "@/lib/utils/time";

/** Search and status tab for the welfare list, applied to the loaded list, plus per-status counts. */
export function useWelfareFilters(requests: WelfareRequestRow[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WelfareStatus | "">("");
  const term = search.trim().toLowerCase();

  const filtered = requests.filter((r) => {
    if (status && r.status !== status) return false;
    if (term) {
      const haystack = `${r.fullName} ${r.email} ${r.phone} ${r.description}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const counts: Record<WelfareStatus, number> = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    IN_REVIEW: requests.filter((r) => r.status === "IN_REVIEW").length,
    RESOLVED: requests.filter((r) => r.status === "RESOLVED").length,
    DECLINED: requests.filter((r) => r.status === "DECLINED").length,
  };

  function clearFilters() {
    setSearch("");
    setStatus("");
  }

  return {
    search, setSearch, status, setStatus,
    filtered,
    groups: groupByDay(filtered, (r) => r.submittedAt),
    counts,
    hasFilters: !!(search || status),
    clearFilters,
  };
}

export type WelfareFilterState = ReturnType<typeof useWelfareFilters>;
