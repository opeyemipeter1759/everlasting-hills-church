"use client";

import { useMemo, useState } from "react";
import { Check, Search, UserCheck, X } from "lucide-react";
import {
  useAssignMembers,
  usePeople,
  type PersonRow,
} from "@/lib/api/people";
import { Avatar, ROLE_LABEL } from "./peopleShared";
import PeopleModal, { btnGhost, btnPrimary, fieldCls } from "./PeopleModal";

export default function AssignMembersDialog({
  open,
  onClose,
  preselected,
}: {
  open: boolean;
  onClose: () => void;
  preselected: PersonRow[];
}) {
  const [memberSearch, setMemberSearch] = useState("");
  const [leaderSearch, setLeaderSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(preselected.map((p) => [p.id, p.name])),
  );
  const [leader, setLeader] = useState<{ id: string; name: string } | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const assign = useAssignMembers();

  const memberResults = usePeople({ search: memberSearch, limit: 20 });
  // Leaders: bias to leadership roles, but allow searching anyone.
  const leaderResults = usePeople({
    search: leaderSearch,
    limit: 20,
    ...(leaderSearch ? {} : { role: "UNIT_LEAD" }),
  });

  const selectedIds = useMemo(() => Object.keys(selected), [selected]);

  function toggleMember(p: PersonRow) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = p.name;
      return next;
    });
  }

  function close() {
    setMemberSearch("");
    setLeaderSearch("");
    setSelected({});
    setLeader(null);
    setNote("");
    setError(null);
    setDone(null);
    onClose();
  }

  async function submit() {
    if (!leader || selectedIds.length === 0) return;
    setError(null);
    try {
      const res = await assign.mutateAsync({
        memberIds: selectedIds,
        leaderId: leader.id,
        note: note.trim() || undefined,
      });
      setDone(`Assigned ${res.assigned} to ${leader.name}${res.skipped ? ` · ${res.skipped} already assigned` : ""}.`);
      setTimeout(close, 1200);
    } catch (err) {
      setError((err as { message?: string }).message ?? "Assignment failed");
    }
  }

  return (
    <PeopleModal
      open={open}
      onClose={close}
      title="Assign for follow-up & discipleship"
      subtitle="Pick the people to shepherd, then choose the leader who will care for them."
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={close}>
            Cancel
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={!leader || selectedIds.length === 0 || assign.isPending}
            onClick={submit}
          >
            <UserCheck size={15} />
            {assign.isPending ? "Assigning…" : `Assign ${selectedIds.length || ""}`.trim()}
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Step 1 — members */}
        <section>
          <p className="text-xs font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a] mb-2">
            1 · People to assign
          </p>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedIds.map((id) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 text-xs font-semibold pl-2.5 pr-1.5 py-1 rounded-full bg-[#87102C] text-white"
                >
                  {selected[id]}
                  <button
                    type="button"
                    onClick={() => setSelected((prev) => { const n = { ...prev }; delete n[id]; return n; })}
                    className="hover:bg-white/20 rounded-full p-0.5"
                    aria-label={`Remove ${selected[id]}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <SearchBox value={memberSearch} onChange={setMemberSearch} placeholder="Search people to assign…" />
          <ResultList
            rows={memberResults.data?.data ?? []}
            loading={memberResults.isLoading}
            isSelected={(p) => Boolean(selected[p.id])}
            onPick={toggleMember}
            multi
          />
        </section>

        {/* Step 2 — leader */}
        <section>
          <p className="text-xs font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a] mb-2">
            2 · Assign to leader
          </p>
          {leader ? (
            <div className="flex items-center justify-between rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-[#FFF4F6]/50 dark:bg-white/[0.03] px-3 py-2.5 mb-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{leader.name}</span>
              <button
                type="button"
                onClick={() => setLeader(null)}
                className="text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <SearchBox value={leaderSearch} onChange={setLeaderSearch} placeholder="Search leader (unit leads shown by default)…" />
              <ResultList
                rows={leaderResults.data?.data ?? []}
                loading={leaderResults.isLoading}
                isSelected={() => false}
                onPick={(p) => setLeader({ id: p.id, name: p.name })}
              />
            </>
          )}
        </section>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">
            Note (optional)
          </label>
          <input
            className={fieldCls}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. New convert — weekly check-in"
          />
        </div>

        {done && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl px-3 py-2 inline-flex items-center gap-2">
            <Check size={15} /> {done}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </PeopleModal>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      <input className={`${fieldCls} pl-10`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ResultList({
  rows,
  loading,
  isSelected,
  onPick,
  multi,
}: {
  rows: PersonRow[];
  loading: boolean;
  isSelected: (p: PersonRow) => boolean;
  onPick: (p: PersonRow) => void;
  multi?: boolean;
}) {
  return (
    <div className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-[#E7CDD3]/60 dark:border-white/10 divide-y divide-[#E7CDD3]/40 dark:divide-white/[0.06]">
      {loading ? (
        <p className="px-3 py-4 text-xs text-gray-400">Searching…</p>
      ) : rows.length === 0 ? (
        <p className="px-3 py-4 text-xs text-gray-400">No matches.</p>
      ) : (
        rows.map((p) => {
          const sel = isSelected(p);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                sel ? "bg-[#FFF4F6] dark:bg-[#87102C]/10" : "hover:bg-[#FFF4F6]/50 dark:hover:bg-white/[0.03]"
              }`}
            >
              <Avatar photoUrl={p.photoUrl} firstName={p.firstName} lastName={p.lastName} size={32} />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-gray-900 dark:text-white truncate">{p.name}</span>
                <span className="block text-[11px] text-gray-400 dark:text-white/40 truncate">
                  {ROLE_LABEL[p.role]}
                  {p.email ? ` · ${p.email}` : ""}
                </span>
              </span>
              {multi && sel && <Check size={16} className="text-[#87102C] dark:text-[#e8768a]" />}
            </button>
          );
        })
      )}
    </div>
  );
}
