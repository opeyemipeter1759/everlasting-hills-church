"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, Users } from "lucide-react";
import { useFamilyDirectory, type FamilyDirectoryEntry } from "@/lib/api/family";
import { Pagination } from "./Pagination";

function Avatar({ m }: { m: Pick<FamilyDirectoryEntry, "firstName" | "lastName" | "photoUrl"> }) {
  const initials = `${m.firstName[0] ?? ""}${m.lastName[0] ?? ""}`.toUpperCase();
  return m.photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m.photoUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded-full object-cover" />
  ) : (
    <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#FFE8ED] text-base font-bold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
      {initials || "?"}
    </span>
  );
}

/**
 * Every active member, searchable by name, each opening their profile.
 *
 * The search and the page live in the address (?q=…&page=…), so the back
 * button from a profile returns to the same page of the same search, and a
 * page can be shared.
 */
export default function FamilyDirectory() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const searchFor = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const [query, setQuery] = useState(searchFor);
  const listTop = useRef<HTMLLabelElement>(null);

  const go = (next: { q?: string; page?: number }) => {
    const q = next.q ?? searchFor;
    const p = next.page ?? page;
    const search = new URLSearchParams();
    if (q.trim()) search.set("q", q.trim());
    if (p > 1) search.set("page", String(p));
    const qs = search.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Typing searches after a short pause, from the first page.
  useEffect(() => {
    if (query.trim() === searchFor.trim()) return;
    const timer = window.setTimeout(() => go({ q: query, page: 1 }), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const { data, isLoading, isError, refetch } = useFamilyDirectory(searchFor, page);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  // A page past the end (after a search narrowed the list) falls back to the last.
  useEffect(() => {
    if (data && page > pages) go({ page: pages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, page, pages]);

  const changePage = (next: number) => {
    go({ page: next });
    listTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const first = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const last = data ? Math.min(data.total, first + data.items.length - 1) : 0;

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#87102C]/80 dark:text-white/40 xs:tracking-[0.28em]">
          Member Portal
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#111] dark:text-white">Church Family</h1>
        <p className="mt-1 text-sm text-[#8a7e80] dark:text-white/45">
          Find a brother or sister and open their profile. Phone numbers, emails and addresses are never shown here.
        </p>
      </header>

      <label className="relative block scroll-mt-24" ref={listTop}>
        <span className="sr-only">Search members by name</span>
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7e80]" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          className="w-full rounded-xl border border-[#E7CDD3]/60 bg-white py-3 pl-11 pr-4 text-sm text-[#111] focus:border-[#87102C] focus:outline-none focus:ring-2 focus:ring-[#87102C]/15 dark:border-white/[0.10] dark:bg-white/[0.06] dark:text-white"
        />
      </label>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : isError || !data ? (
        <p role="alert" className="text-sm text-[#8a7e80] dark:text-white/50">
          Could not load the church family.{" "}
          <button type="button" onClick={() => refetch()} className="min-h-11 font-semibold text-[#87102C] underline dark:text-[#FFB3C1]">
            Try again
          </button>
        </p>
      ) : data.items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[#E7CDD3] p-6 text-sm text-[#8a7e80] dark:border-white/10 dark:text-white/50">
          <Users size={18} aria-hidden="true" /> No member matches “{searchFor.trim()}”.
        </div>
      ) : (
        <>
          <p aria-live="polite" className="text-xs text-[#8a7e80] dark:text-white/45">
            {data.total <= data.pageSize
              ? `${data.total} ${data.total === 1 ? "member" : "members"}`
              : `Showing ${first}–${last} of ${data.total} members`}
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/dashboard/family/${m.id}`}
                  className="flex items-center gap-4 rounded-2xl border border-[#E7CDD3]/60 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#E7CDD3] hover:shadow-[0_8px_40px_rgba(135,16,44,0.08)] dark:border-white/[0.09] dark:bg-white/[0.05] dark:hover:border-white/[0.18]"
                >
                  <Avatar m={m} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-[#111] dark:text-white">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="truncate text-xs text-[#8a7e80] dark:text-white/45">
                      {m.units.length > 0 ? m.units.join(" · ") : "Member"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={page} pages={pages} onChange={changePage} label="Church family pages" />
        </>
      )}
    </div>
  );
}
