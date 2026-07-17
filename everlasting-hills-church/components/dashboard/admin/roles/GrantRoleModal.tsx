"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import FormModal, { fieldCls } from "@/components/ui/overlay/FormModal";
import { usePeople, useGrantRole, useAssignHeadUsher, type PersonRole } from "@/lib/api/people";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { ROLE_LABEL } from "../people/peopleShared";
import { Avatar } from "../departments/HeadPicker";

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}


export default function GrantRoleModal({
  open,
  onClose,
  grantableRoles,
}: {
  open: boolean;
  onClose: () => void;
  grantableRoles: PersonRole[];
}) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<PersonRole | "">(grantableRoles[0] ?? "");
  const [pickingId, setPickingId] = useState<string | null>(null);
  const q = usePeople({ search, limit: 12, sortBy: "name", sortOrder: "asc" });
  const grant = useGrantRole();
  const assignHeadUsher = useAssignHeadUsher();
  const pending = grant.isPending || assignHeadUsher.isPending;
  const people = (q.data?.data ?? []).filter((p) => p.profileId);

  async function pick(profileId: string, name: string) {
    if (!role) return;
    setPickingId(profileId);
    try {
      if (role === "HEAD_USHER") {
        await assignHeadUsher.mutateAsync(profileId);
      } else {
        await grant.mutateAsync({ profileId, role });
      }
      showToast.success(`${name} granted ${ROLE_LABEL[role]}`);
      onClose();
    } catch (err) {
      showToast.error(errorMessage(err, `Couldn't grant ${ROLE_LABEL[role]}`));
    } finally {
      setPickingId(null);
    }
  }

  return (
    <FormModal open={open} title="Grant a role" subtitle="Additive — doesn't remove any role they already hold" onClose={onClose} maxWidth="max-w-lg">
      <div className="mb-3">
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">Role to grant</label>
        <select value={role} onChange={(e) => setRole(e.target.value as PersonRole)} className={fieldCls}>
          {grantableRoles.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </div>

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
          people.map((p) => {
            const isPicking = pending && pickingId === p.profileId;
            return (
              <button
                key={p.profileId}
                type="button"
                disabled={pending || !role}
                onClick={() => pick(p.profileId as string, p.name)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] px-3.5 py-2.5 text-left transition-colors hover:border-[#87102C]/30 hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.06] disabled:opacity-50"
              >
                <Avatar name={p.name} photoUrl={p.photoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{p.name}</p>
                  <p className="truncate text-[11px] text-gray-400">{p.email ?? "No email"}</p>
                </div>
                {isPicking ? (
                  <Loader2 size={14} className="shrink-0 animate-spin text-[#87102C] dark:text-[#e8768a]" />
                ) : (
                  <span className="shrink-0 rounded-full bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
                    {ROLE_LABEL[p.role]}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </FormModal>
  );
}
