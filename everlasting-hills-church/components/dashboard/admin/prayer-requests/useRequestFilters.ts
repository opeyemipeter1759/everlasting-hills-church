import { useState } from "react";
import type { PrayerRequestRow, PrayerRequestStatus } from "@/lib/api/prayer-requests";
import { groupByDay } from "@/lib/utils/time";

/** Search, date range and status tab for the prayer request list, applied to the loaded list. */
export function useRequestFilters(requests: PrayerRequestRow[]) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PrayerRequestStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const term = search.trim().toLowerCase();
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

  const filtered = requests.filter((r) => {
    // Prayed-for requests are archived out of the default view — "Prayed for"
    // is the only tab that shows them, mirroring the Follow-Up Pipeline's
    // Archive tab for opted-out members.
    if (status === "PRAYED") {
      if (r.status !== "PRAYED") return false;
    } else if (r.status === "PRAYED") {
      return false;
    }
    const submitted = new Date(r.submittedAt);
    if (from && submitted < from) return false;
    if (to && submitted > to) return false;
    if (term) {
      const displayName = r.member ? `${r.member.firstName} ${r.member.lastName}` : r.name ?? "";
      const haystack = `${r.request} ${displayName} ${r.email ?? ""} ${r.member?.email ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  function clearFilters() {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  }

  return {
    search, setSearch, status, setStatus, dateFrom, setDateFrom, dateTo, setDateTo,
    filtered,
    groups: groupByDay(filtered, (r) => r.submittedAt),
    hasFilters: !!(search || status || dateFrom || dateTo),
    clearFilters,
  };
}

export type RequestFilterState = ReturnType<typeof useRequestFilters>;
