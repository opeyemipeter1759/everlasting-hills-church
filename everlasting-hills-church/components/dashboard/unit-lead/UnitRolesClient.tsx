"use client";

import { useState } from "react";
import { Plus, Shield, Trash2 } from "lucide-react";
import { useUnitLeadContext } from "./useUnitLeadContext";
import { useUnitPositions, useCreateUnitPosition, useDeleteUnitPosition } from "@/lib/api";
import UnitLeadTabs from "./UnitLeadTabs";
import SubmitButton from "@/components/ui/form/SubmitButton";

export default function UnitRolesClient({ unitId }: { unitId: string }) {
  const { summary } = useUnitLeadContext(unitId);
  const { data: positions } = useUnitPositions(unitId);
  const create = useCreateUnitPosition();
  const del = useDeleteUnitPosition();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (summary === undefined) return null;
  if (!summary) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      await create.mutateAsync({ unitId, name: name.trim() });
      setName("");
    } catch (err) {
      setError((err as { message?: string }).message ?? "Couldn't create role");
    }
  }

  return (
    <div className="space-y-5 mx-auto max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{summary.name}</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Custom roles/titles you can assign to members of this unit — e.g. Secretary, Treasurer.
        </p>
      </div>

      <UnitLeadTabs unitId={unitId} active="roles" />

      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/8">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
            Roles {positions ? `(${positions.length})` : ""}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Secretary"
              maxLength={60}
              className="flex-1 text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
            />
            <SubmitButton loading={create.isPending} disabled={!name.trim()} className="px-3 py-2">
              <Plus size={13} className="inline mr-1" /> Add role
            </SubmitButton>
          </form>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded px-2 py-1.5">
              {error}
            </p>
          )}

          {positions && positions.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
              No roles defined yet. Add one above, then assign it to a member from the Members tab.
            </p>
          )}

          {positions && positions.length > 0 && (
            <ul className="space-y-2">
              {positions.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.02]"
                >
                  <Shield size={14} className="text-[#87102C] dark:text-[#e8768a] flex-shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-gray-900 dark:text-white">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => del.mutate({ unitId, positionId: p.id })}
                    title="Delete role"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
