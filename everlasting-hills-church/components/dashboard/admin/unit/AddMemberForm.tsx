"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api/request";
import type { MemberRow } from "@/types";
import SubmitButton from "@/components/ui/form/SubmitButton";

interface AddMemberFormProps {
  existingMemberIds: string[];
  canPromoteLead: boolean;
  onCancel: () => void;
  onAdded: (memberId: string, isLead: boolean) => Promise<void>;
}

export default function AddMemberForm({
  existingMemberIds,
  canPromoteLead,
  onCancel,
  onAdded,
}: AddMemberFormProps) {
  const [allMembers, setAllMembers] = useState<MemberRow[]>([]);

  useEffect(() => {
    api.get<MemberRow[]>("/members", { status: "ACTIVE" }).then(setAllMembers).catch(() => {});
  }, []);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [makeLead, setMakeLead] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allMembers
      .filter((m) => !existingMemberIds.includes(m.id))
      .filter((m) =>
        q ? `${m.firstName} ${m.lastName} ${m.email ?? ""}`.toLowerCase().includes(q) : true,
      )
      .slice(0, 10);
  }, [allMembers, existingMemberIds, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId) {
      setError("Pick a member first");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onAdded(selectedId, makeLead);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 p-4 rounded-xl border border-[#87102C]/20 bg-[#87102C]/[0.03] space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Add a member</p>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-700 p-0.5" aria-label="Close">
          <X size={14} />
        </button>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setSelectedId(null);
        }}
        placeholder="Search by name or email…"
        className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
      />

      {candidates.length > 0 && (
        <ul className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 dark:border-white/8 rounded-lg p-1 bg-white dark:bg-[#1c1c1e]">
          {candidates.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setSelectedId(m.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  selectedId === m.id
                    ? "bg-[#87102C]/10 text-[#87102C] dark:text-[#e8768a] font-semibold"
                    : "hover:bg-gray-50 dark:hover:bg-white/[0.04] text-gray-700 dark:text-gray-300"
                }`}
              >
                {m.firstName} {m.lastName}
                {m.email && <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{m.email}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {candidates.length === 0 && search && (
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          No matching members. They might already be in the unit, or you may need to create
          them on the Users page first.
        </p>
      )}

      {canPromoteLead && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={makeLead}
            onChange={(e) => setMakeLead(e.target.checked)}
            className="w-4 h-4 rounded text-[#87102C] focus:ring-[#87102C]/30"
          />
          <span className="text-xs text-gray-700 dark:text-gray-300">Add as the unit lead</span>
        </label>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded px-2 py-1.5">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <SubmitButton loading={saving} disabled={!selectedId} className="px-3 py-2">
          {saving ? "Adding…" : "Add to unit"}
        </SubmitButton>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}