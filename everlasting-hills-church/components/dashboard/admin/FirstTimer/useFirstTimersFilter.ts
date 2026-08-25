import { useMemo, useState } from "react";
import type { VisitorRow } from "./types";

export type InterestFilter = "all" | "yes" | "no";

export const PAGE_SIZE_OPTIONS = [8, 20, 50, 100];
const DEFAULT_PAGE_SIZE = 8;

export function useFirstTimersFilter(visitors: VisitorRow[]) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [edits, setEdits] = useState<Record<string, Partial<VisitorRow>>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InterestFilter>("all");
  // Inclusive "YYYY-MM-DD" bounds on submittedAt. Empty means unbounded, so the
  // usual case (no dates picked) costs nothing.
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  function handleCreated(visitorId: string) {
    setRemovedIds((prev) => new Set(prev).add(visitorId));
  }

  function handleDeleted(visitorId: string) {
    setRemovedIds((prev) => new Set(prev).add(visitorId));
  }

  function handleUpdated(visitorId: string, patch: Partial<VisitorRow>) {
    setEdits((prev) => ({ ...prev, [visitorId]: { ...prev[visitorId], ...patch } }));
  }

  const active = useMemo(
    () =>
      visitors
        .filter((v) => !removedIds.has(v.id))
        .map((v) => (edits[v.id] ? { ...v, ...edits[v.id] } : v)),
    [visitors, removedIds, edits],
  );

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
      // Compared as date strings rather than Date objects so a submission at
      // 23:30 on the "to" day still counts as that day, whatever the timezone
      // of the browser reading it.
      const day = v.submittedAt.slice(0, 10);
      const matchFrom = !fromDate || day >= fromDate;
      const matchTo = !toDate || day <= toDate;
      return matchQ && matchFilter && matchFrom && matchTo;
    });
  }, [active, search, filter, fromDate, toDate]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pagedRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  function updateSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function updateFilter(f: InterestFilter) {
    setFilter(f);
    setPage(1);
  }

  function updateFromDate(v: string) {
    setFromDate(v);
    setPage(1);
  }

  function updateToDate(v: string) {
    setToDate(v);
    setPage(1);
  }

  function clearDates() {
    setFromDate("");
    setToDate("");
    setPage(1);
  }

  function updatePageSize(v: number) {
    setPageSize(v);
    setPage(1);
  }

  const filterTabs = [
    { key: "all" as const, label: "All", count: active.length },
    { key: "yes" as const, label: "Interested", count: interestedCount },
    { key: "no" as const, label: "Not yet", count: notYetCount },
  ];

  return {
    handleCreated,
    handleDeleted,
    handleUpdated,
    active,
    search,
    setSearch: updateSearch,
    filter,
    setFilter: updateFilter,
    fromDate,
    setFromDate: updateFromDate,
    toDate,
    setToDate: updateToDate,
    clearDates,
    filtered,
    pagedRows,
    page: safePage,
    pageCount,
    setPage,
    pageSize,
    setPageSize: updatePageSize,
    filterTabs,
    total: active.length,
  };
}
