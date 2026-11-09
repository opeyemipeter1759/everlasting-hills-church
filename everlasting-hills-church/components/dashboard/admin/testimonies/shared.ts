import type { ApiError } from "@/lib/api/axios";

export function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

export type ReadTab = "UNREAD" | "READ";

export type StatusFilter = "" | "PUBLISHED" | "DRAFT";

export const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
];

export type ShareFilter = "" | "SHARED" | "NOT_SHARED";

export const SHARE_TABS: { label: string; value: ShareFilter }[] = [
  { label: "All", value: "" },
  { label: "Willing to Share", value: "SHARED" },
  { label: "Not Willing to Share", value: "NOT_SHARED" },
];

export const PAGE_SIZE_OPTIONS = [10, 25, 50];
export const DEFAULT_PAGE_SIZE = 10;

export const EMPTY_BOX = "rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-5 xs:p-8 sm:p-12 text-center";

/** Grey outline button used for the "undo" side of each card toggle. */
export const OUTLINE_TOGGLE =
  "border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5";
