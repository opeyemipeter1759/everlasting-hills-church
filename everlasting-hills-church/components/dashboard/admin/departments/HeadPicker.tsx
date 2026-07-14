"use client";

import { useState } from "react";
import { Search, AlertTriangle, Check } from "lucide-react";
import FormModal from "@/components/ui/overlay/FormModal";
import { usePeople } from "@/lib/api/people";
import { ROLE_LABEL } from "@/components/dashboard/admin/people/peopleShared";

/** Searchable person picker for assigning a department head. Returns a profileId. */
export default function HeadPicker({
  open,
  onClose,
  onPick,
  pending,
  currentHeadName,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (profileId: string) => void;
  pending: boolean;
  currentHeadName?: string | null;
}) {
  const [search, setSearch] = useState("");
  const q = usePeople({ search, limit: 12, sortBy: "name", sortOrder: "asc" });
  const people = (q.data?.data ?? []).filter((p) => p.profileId);

  return (
    <FormModal
      open={open}
      title={currentHeadName ? "Replace department head" : "Assign department head"}
      subtitle={currentHeadName ? `Replacing ${currentHeadName} ends their tenure` : "Pick the person to lead this department"}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      {currentHeadName && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-2.5 text-[12px] text-amber-700 dark:text-amber-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>Assigning a new head ends {currentHeadName}&apos;s current tenure. The succession history is preserved.</span>
        </div>
      )}

      <div className="relative mb-3">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40"
        />
      </div>

      <div className="max-h-72 space-y-1.5 overflow-y-auto">
        {q.isLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />)
        ) : people.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No people found.</p>
        ) : (
          people.map((p) => (
            <button
              key={p.profileId}
              type="button"
              disabled={pending}
              onClick={() => onPick(p.profileId as string)}
              className="flex w-full items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3.5 py-2.5 text-left transition-colors hover:border-[#87102C]/30 hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.06] disabled:opacity-50"
            >
              <Avatar name={p.name} photoUrl={p.photoUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{p.name}</p>
                <p className="truncate text-[11px] text-gray-400">{p.email ?? "No email"}</p>
              </div>
              <span className="shrink-0 rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
                {ROLE_LABEL[p.role]}
              </span>
              <Check size={16} className="shrink-0 text-[#87102C] opacity-0 group-hover:opacity-100" />
            </button>
          ))
        )}
      </div>
    </FormModal>
  );
}

export function Avatar({ name, photoUrl, px = 36 }: { name: string; photoUrl: string | null; px?: number }) {
  const initials = name.split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt={name} style={{ width: px, height: px }} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      style={{ width: px, height: px }}
      className="flex shrink-0 items-center justify-center rounded-full bg-[#87102C]/10 text-[11px] font-black text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#e8768a]"
    >
      {initials || "?"}
    </span>
  );
}
