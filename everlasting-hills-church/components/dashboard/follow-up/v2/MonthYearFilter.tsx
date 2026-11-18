"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/select";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** The month and year a first-timer list is narrowed to, read from and kept in the URL. */
export function useMonthYearParams(): { year?: number; month?: number } {
  const params = useSearchParams();
  const year = Number(params.get("year")) || undefined;
  const month = year ? Number(params.get("month")) || undefined : undefined;
  return { year, month: month && month >= 1 && month <= 12 ? month : undefined };
}

/**
 * Month and year filters for any first-timer list, written to the URL so a
 * filtered list can be shared or bookmarked. Months bucket on the first visit.
 */
export function MonthYearFilter({ firstYear }: { firstYear?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { year, month } = useMonthYearParams();
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - (firstYear ?? thisYear - 1) + 1 }, (_, i) => thisYear - i);

  function set(next: { year?: number; month?: number }) {
    const q = new URLSearchParams(params.toString());
    for (const key of ["year", "month", "page"]) q.delete(key);
    if (next.year) q.set("year", String(next.year));
    if (next.year && next.month) q.set("month", String(next.month));
    router.replace(q.size ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        aria-label="Year"
        value={year ? String(year) : ""}
        onChange={(v) => set({ year: v ? Number(v) : undefined })}
        className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#111] dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        options={[{ value: "", label: "Any year" }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
      />
      <Select
        aria-label="Month"
        value={month ? String(month) : ""}
        onChange={(v) => set({ year, month: v ? Number(v) : undefined })}
        className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-[#111] dark:border-white/10 dark:bg-white/[0.05] dark:text-white"
        options={[{ value: "", label: year ? "Any month" : "Pick a year first" }, ...(year ? MONTHS.map((m, i) => ({ value: String(i + 1), label: m })) : [])]}
      />
    </div>
  );
}
