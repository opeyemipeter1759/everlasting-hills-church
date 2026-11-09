import { useEffect, useState } from "react";
import type { AdminTestimonial } from "@/lib/api/testimonials";
import { groupByDay } from "@/lib/utils/time";
import { DEFAULT_PAGE_SIZE, type ReadTab, type ShareFilter, type StatusFilter } from "./shared";

/**
 * Unread/Read tab, search, date range, published and share filters, and
 * paging for the testimonies list — all applied to the loaded list.
 */
export function useTestimonyFilters(testimonials: AdminTestimonial[]) {
  const [readTab, setReadTab] = useState<ReadTab>("UNREAD");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [share, setShare] = useState<ShareFilter>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const term = search.trim().toLowerCase();
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
  const unreadCount = testimonials.filter((t) => !t.readAt).length;

  const filtered = testimonials.filter((t) => {
    if (readTab === "UNREAD" && t.readAt) return false;
    if (readTab === "READ" && !t.readAt) return false;
    if (status === "PUBLISHED" && !t.published) return false;
    if (status === "DRAFT" && t.published) return false;
    if (share === "SHARED" && t.sharePhysically !== true) return false;
    if (share === "NOT_SHARED" && t.sharePhysically !== false) return false;
    const created = new Date(t.createdAt);
    if (from && created < from) return false;
    if (to && created > to) return false;
    if (term) {
      const haystack = `${t.content} ${t.authorName} ${t.authorRole ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => setPage(1), [readTab, search, status, share, dateFrom, dateTo]);
  // Clamp back if a filter shrinks the result set below the page we were sitting on.
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  function clearFilters() {
    setSearch("");
    setStatus("");
    setShare("");
    setDateFrom("");
    setDateTo("");
  }

  return {
    readTab, setReadTab, search, setSearch, status, setStatus, share, setShare,
    dateFrom, setDateFrom, dateTo, setDateTo, page, setPage, pageSize, setPageSize,
    unreadCount,
    readCount: testimonials.length - unreadCount,
    filtered,
    pageCount,
    groups: groupByDay(paged, (t) => t.createdAt),
    hasFilters: !!(search || status || share || dateFrom || dateTo),
    clearFilters,
  };
}

export type TestimonyFilterState = ReturnType<typeof useTestimonyFilters>;
