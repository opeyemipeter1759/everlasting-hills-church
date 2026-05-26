import Link from "next/link";
import { Mail, Phone, Search, Users } from "lucide-react";
import { serverApi } from "@/lib/api/server";

export const metadata = { title: "Members — Dashboard" };
export const dynamic = "force-dynamic";

/**
 * Member directory.
 *
 * Server Component → NestJS /members. Middleware ensures ADMIN+ has reached this route;
 * the @Roles guard on the backend controller enforces the same rule defense-in-depth.
 *
 * Search is currently URL-driven (?q=...) and re-runs as a server fetch. For interactive
 * filtering across larger lists, swap to a Client Component + TanStack Query later.
 */

interface MemberRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  joinedAt: string;
  status?: string;
  photoUrl?: string | null;
}

interface PageProps {
  searchParams: { q?: string; status?: string };
}

function fmtJoinedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default async function MembersPage({ searchParams }: PageProps) {
  const query = new URLSearchParams();
  if (searchParams.q) query.set("search", searchParams.q);
  if (searchParams.status) query.set("status", searchParams.status);
  const qs = query.toString();

  let members: MemberRow[] = [];
  let loadError: string | null = null;
  try {
    members = await serverApi.get<MemberRow[]>(`/members${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
  } catch (err) {
    loadError = (err as { message?: string }).message ?? "Failed to load members";
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Members</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {members.length} {members.length === 1 ? "member" : "members"}
            {searchParams.q ? ` matching "${searchParams.q}"` : ""}
          </p>
        </div>

        {/* Search (URL-driven, no JS required) */}
        <form className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search members…"
              className="text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
            />
          </div>
          <button
            type="submit"
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-[#87102C] text-white hover:bg-[#6E0C24] transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error state */}
      {loadError && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
          {loadError}
        </div>
      )}

      {/* Empty state */}
      {!loadError && members.length === 0 && (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
          <Users size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No members found</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {searchParams.q ? "Try a different search term" : "Convert your first visitor from the First Timers page"}
          </p>
        </div>
      )}

      {/* List */}
      {members.length > 0 && (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
          <ul className="divide-y divide-gray-100 dark:divide-white/8">
            {members.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/dashboard/members/${m.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group"
                >
                  {m.photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={m.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 flex items-center justify-center text-sm font-bold text-[#87102C] dark:text-[#e8768a] flex-shrink-0">
                      {initials(m.firstName, m.lastName)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[#87102C] dark:group-hover:text-[#e8768a] transition-colors">
                      {m.firstName} {m.lastName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex-wrap">
                      {m.email && (
                        <span className="inline-flex items-center gap-1 min-w-0 truncate">
                          <Mail size={11} className="flex-shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </span>
                      )}
                      {m.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={11} />
                          {m.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {m.status && (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          m.status === "ACTIVE"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {m.status}
                      </span>
                    )}
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      Joined {fmtJoinedDate(m.joinedAt)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
