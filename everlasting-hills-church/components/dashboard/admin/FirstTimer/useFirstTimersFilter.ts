import { useMemo, useState } from "react";
import type { VisitorRow } from "./types";

export type InterestFilter = "all" | "yes" | "no";

const PAGE_SIZE = 8;

export function useFirstTimersFilter(visitors: VisitorRow[]) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InterestFilter>("all");
  const [page, setPage] = useState(1);

  function handleCreated(visitorId: string) {
    setRemovedIds((prev) => new Set(prev).add(visitorId));
  }

  const active = useMemo(() => visitors.filter((v) => !removedIds.has(v.id)), [visitors, removedIds]);

  const interestedCount = active.filter((v) => v.membershipInterest === "Yes").length;
  const notYetCount = active.filter((v) => v.membershipInterest !== "Yes").length;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return active.filter((v) => {
      const matchQ =
        !q ||
        `${v.firstName} ${v.lastName}`.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q) ||
        v.phone?.includes(q);
      const matchFilter =
        filter === "all" ||
        (filter === "yes" && v.membershipInterest === "Yes") ||
        (filter === "no" && v.membershipInterest !== "Yes");
      return matchQ && matchFilter;
    });
  }, [active, search, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  function updateSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function updateFilter(f: InterestFilter) {
    setFilter(f);
    setPage(1);
  }

  const filterTabs = [
    { key: "all" as const, label: "All", count: active.length },
    { key: "yes" as const, label: "Interested", count: interestedCount },
    { key: "no" as const, label: "Not yet", count: notYetCount },
  ];

  return {
    handleCreated,
    search,
    setSearch: updateSearch,
    filter,
    setFilter: updateFilter,
    filtered,
    pagedRows,
    page: safePage,
    pageCount,
    setPage,
    filterTabs,
    total: active.length,
  };
}
