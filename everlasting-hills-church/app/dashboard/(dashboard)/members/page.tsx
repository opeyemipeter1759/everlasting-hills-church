import { Search } from "lucide-react";
import { serverApi } from "@/lib/api/server";
import MembersListClient, {
  type MemberRow,
} from "@/components/dashboard/admin/MembersListClient";

export const metadata = { title: "Members — Dashboard" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { q?: string; status?: string };
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

      {/* List + delete (client-side so the row can show ConfirmDialog) */}
      {!loadError && (
        <MembersListClient initialMembers={members} searchQuery={searchParams.q} />
      )}
    </div>
  );
}
