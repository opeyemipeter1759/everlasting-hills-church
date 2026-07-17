"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, UserMinus, UserPlus } from "lucide-react";
import { useUsersByRole } from "@/lib/api";
import { useRevokeGrant, useRemoveHeadUsher, type PersonRole } from "@/lib/api/people";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { Avatar } from "../departments/HeadPicker";
import { ROLE_LABEL } from "../people/peopleShared";
import GrantRoleModal from "./GrantRoleModal";

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

export default function GlobalRolesSection({ grantable }: { grantable: PersonRole[] }) {
  const byRole = useUsersByRole();
  const revoke = useRevokeGrant();
  const removeHeadUsher = useRemoveHeadUsher();
  const [grantOpen, setGrantOpen] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<{ profileId: string; role: PersonRole; name: string } | null>(null);

  const groups: { role: PersonRole; people: { profileId: string; member: { firstName: string; lastName: string; photoUrl: string | null } | null }[] }[] = [
    { role: "SUPER_ADMIN", people: byRole.data?.SUPER_ADMIN ?? [] },
    { role: "PASTOR", people: byRole.data?.PASTOR ?? [] },
    { role: "ADMIN_HEAD", people: byRole.data?.ADMIN_HEAD ?? [] },
    { role: "HOD", people: byRole.data?.HOD ?? [] },
    { role: "HEAD_USHER", people: byRole.data?.HEAD_USHER ?? [] },
  ];

  const revokePending = revoke.isPending || removeHeadUsher.isPending;

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-[#87102C] dark:text-[#e8768a]" />
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">Global roles</h2>
        </div>
        {grantable.length > 0 && (
          <button
            type="button"
            onClick={() => setGrantOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#87102C] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#6E0C24]"
          >
            <UserPlus size={14} /> Grant a role
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {groups.map((g) => (
          <div key={g.role}>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">{ROLE_LABEL[g.role]}</p>
            {byRole.isLoading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-[42px] animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                ))}
              </div>
            ) : g.people.length === 0 ? (
              <p className="text-xs text-gray-400">No one yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {g.people.map((p) => {
                  const name = p.member ? `${p.member.firstName} ${p.member.lastName}` : "Unknown";
                  const canRevoke = grantable.includes(g.role);
                  const isRevoking = revokePending && confirmRevoke?.profileId === p.profileId && confirmRevoke.role === g.role;
                  return (
                    <li key={p.profileId} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-2.5 py-2">
                      <Avatar name={name} photoUrl={p.member?.photoUrl ?? null} px={26} />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-800 dark:text-white/80">{name}</span>
                      {canRevoke && (
                        <button
                          type="button"
                          disabled={isRevoking}
                          onClick={() => setConfirmRevoke({ profileId: p.profileId, role: g.role, name })}
                          className="shrink-0 rounded-lg p-1 text-gray-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-500/10"
                          aria-label={`Revoke ${ROLE_LABEL[g.role]} from ${name}`}
                        >
                          {isRevoking ? <Loader2 size={13} className="animate-spin" /> : <UserMinus size={13} />}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>

      <GrantRoleModal open={grantOpen} onClose={() => setGrantOpen(false)} grantableRoles={grantable} />

      <ConfirmDialog
        open={!!confirmRevoke}
        title={`Revoke ${confirmRevoke ? ROLE_LABEL[confirmRevoke.role] : ""}?`}
        description={confirmRevoke ? `${confirmRevoke.name} will lose this role immediately.` : ""}
        confirmLabel="Yes, revoke"
        tone="warning"
        loading={revokePending}
        onConfirm={async () => {
          if (!confirmRevoke) return;
          try {
            if (confirmRevoke.role === "HEAD_USHER") {
              await removeHeadUsher.mutateAsync(confirmRevoke.profileId);
            } else {
              await revoke.mutateAsync(confirmRevoke);
            }
            showToast.success(`${ROLE_LABEL[confirmRevoke.role]} revoked from ${confirmRevoke.name}`);
            setConfirmRevoke(null);
          } catch (err) {
            showToast.error(errorMessage(err, `Couldn't revoke ${ROLE_LABEL[confirmRevoke.role]}`));
          }
        }}
        onCancel={() => setConfirmRevoke(null)}
      />
    </section>
  );
}
