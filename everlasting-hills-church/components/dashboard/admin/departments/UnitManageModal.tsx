"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Crown, ListTodo, Loader2, Search, Shield, UserMinus, UserPlus, Users2,
} from "lucide-react";
import Modal from "@/components/ui/overlay/Modal";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { useUnitTasks } from "@/lib/api";
import { useAnyUnitRoster } from "@/lib/api/departments";
import { usePeople, useAddMemberToUnit, useRemoveMemberFromUnit } from "@/lib/api/people";
import { Avatar } from "./HeadPicker";
import UnitLeadControl from "./UnitLeadControl";
import { STATUS_ICON, STATUS_LABEL } from "../../units/taskStatus";

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

/**
 * Full unit management for a Head of Department (or ADMIN+): appoint the unit's
 * lead, add/remove members from its roster, and see what the unit is currently
 * working on. Everything here already existed as a backend endpoint (and, for
 * roster/tasks, an unused frontend hook) — this is the first UI to actually
 * expose them together for someone managing a unit they don't personally lead.
 */
export default function UnitManageModal({
  unitId,
  unitName,
  leadName,
  onClose,
}: {
  unitId: string | null;
  unitName: string;
  leadName: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const roster = useAnyUnitRoster(unitId);
  const tasks = useUnitTasks(unitId);
  const addMember = useAddMemberToUnit();
  const removeMember = useRemoveMemberFromUnit();
  const [search, setSearch] = useState("");
  const people = usePeople({ search, limit: 8 });

  function invalidateAfterRosterChange() {
    qc.invalidateQueries({ queryKey: ["departments"] });
    qc.invalidateQueries({ queryKey: ["units", "any", "roster", unitId] });
  }

  async function handleAdd(memberId: string, name: string) {
    if (!unitId) return;
    try {
      await addMember.mutateAsync({ unitId, memberId });
      showToast.success(`${name} added to ${unitName}`);
      invalidateAfterRosterChange();
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't add member"));
    }
  }

  async function handleRemove(memberId: string, name: string) {
    if (!unitId) return;
    try {
      await removeMember.mutateAsync({ unitId, memberId });
      showToast.success(`${name} removed from ${unitName}`);
      invalidateAfterRosterChange();
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't remove member"));
    }
  }

  const rosterMemberIds = new Set((roster.data?.members ?? []).map((m) => m.memberId));
  const searchResults = (people.data?.data ?? []).filter((p) => !rosterMemberIds.has(p.id));

  return (
    <Modal
      open={unitId !== null}
      onClose={onClose}
      title={unitName}
      description="Manage this unit's lead, roster, and current activity."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Lead */}
        <section>
          <SectionLabel icon={Crown}>Unit lead</SectionLabel>
          {unitId && (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {leadName ?? <span className="font-normal text-gray-400">No lead assigned</span>}
              </p>
              <UnitLeadControl unitId={unitId} leadName={leadName} onDone={invalidateAfterRosterChange} />
            </div>
          )}
        </section>

        {/* Roster */}
        <section>
          <SectionLabel icon={Users2}>
            Members {roster.data && `(${roster.data.members.length})`}
          </SectionLabel>
          {roster.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />)}
            </div>
          ) : roster.data && roster.data.members.length > 0 ? (
            <ul className="space-y-1.5">
              {roster.data.members.map((m) => (
                <li
                  key={m.memberId}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-3.5 py-2.5"
                >
                  <Avatar name={`${m.Member.firstName} ${m.Member.lastName}`} photoUrl={m.Member.photoUrl} px={32} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-2 truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {m.Member.firstName} {m.Member.lastName}
                      {m.isLead && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <Crown size={9} /> Lead
                        </span>
                      )}
                      {m.isAssistant && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                          <Shield size={9} /> Assistant
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.memberId, `${m.Member.firstName} ${m.Member.lastName}`)}
                    disabled={removeMember.isPending}
                    title="Remove from unit"
                    aria-label={`Remove ${m.Member.firstName} ${m.Member.lastName} from unit`}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 disabled:opacity-50"
                  >
                    <UserMinus size={15} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-3 text-center text-sm text-gray-400">No members yet.</p>
          )}
        </section>

        {/* Add member */}
        <section>
          <SectionLabel icon={UserPlus}>Add a member</SectionLabel>
          <div className="relative mb-2.5">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-2.5 pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
            />
          </div>
          {search.trim().length > 0 && (
            <div className="max-h-56 space-y-1.5 overflow-y-auto">
              {people.isLoading ? (
                <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
              ) : searchResults.length === 0 ? (
                <p className="py-3 text-center text-sm text-gray-400">No matches.</p>
              ) : (
                searchResults.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-3.5 py-2.5"
                  >
                    <Avatar name={p.name} photoUrl={p.photoUrl} px={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{p.name}</p>
                      <p className="truncate text-[11px] text-gray-400">{p.email ?? "No email"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(p.id, p.name)}
                      disabled={addMember.isPending}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#87102C] px-2.5 py-1.5 text-xs font-bold text-white hover:bg-[#6E0C24] disabled:opacity-50"
                    >
                      {addMember.isPending ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                      Add
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Activities */}
        <section>
          <SectionLabel icon={ListTodo}>Activities {tasks.data && `(${tasks.data.length})`}</SectionLabel>
          {tasks.isLoading ? (
            <div className="space-y-2">
              {[0, 1].map((i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />)}
            </div>
          ) : tasks.data && tasks.data.length > 0 ? (
            <ul className="space-y-1.5">
              {tasks.data.map((t) => {
                const Icon = STATUS_ICON[t.status];
                return (
                  <li
                    key={t.id}
                    className="flex items-start gap-2.5 rounded-xl border border-gray-200 dark:border-white/10 px-3.5 py-2.5"
                  >
                    <Icon size={15} className="mt-0.5 shrink-0 text-gray-400 dark:text-white/40" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{t.title}</p>
                      <p className="text-[11px] text-gray-400">
                        {STATUS_LABEL[t.status]}
                        {t.AssignedTo && ` · ${t.AssignedTo.firstName} ${t.AssignedTo.lastName}`}
                        {t.dueDate && ` · Due ${new Date(t.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-3 text-center text-sm text-gray-400">No activity logged for this unit yet.</p>
          )}
        </section>
      </div>
    </Modal>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: typeof Users2; children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#87102C]/10 text-[#87102C] dark:bg-[#87102C]/20 dark:text-[#e8768a]">
        <Icon size={11} />
      </span>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{children}</p>
    </div>
  );
}
