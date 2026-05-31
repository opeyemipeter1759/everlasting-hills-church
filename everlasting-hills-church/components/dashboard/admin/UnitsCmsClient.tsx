"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Crown,
  Network,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { apiClient } from "@/lib/api/axios";
import { getFrontendSessionUser } from "@/lib/auth/frontend-session";

/**
 * Units CMS.
 *
 * Two-pane master/detail:
 *   - LEFT  → list of all units (cards)
 *   - RIGHT → selected unit's detail panel: members list, add/remove member, promote lead
 *
 * Permission gates are evaluated client-side for UX (hide buttons UNIT_LEADs can't use),
 * but the backend enforces the same rules (defense in depth).
 *   - ADMIN+      → full CRUD on units + any unit's members
 *   - UNIT_LEAD   → can add/remove members in units they lead (no create/delete unit, no lead assignment)
 */

interface Unit {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count: { UnitMember: number };
}

interface UnitDetail extends Unit {
  UnitMember: Array<{
    id: string;
    memberId: string;
    isLead: boolean;
    Member: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      photoUrl: string | null;
      status: string;
    };
  }>;
}

interface MemberRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

type Role = "MEMBER" | "UNIT_LEAD" | "ADMIN" | "PASTOR" | "SUPER_ADMIN" | null;

function isAdminPlus(role: Role): boolean {
  return role === "ADMIN" || role === "PASTOR" || role === "SUPER_ADMIN";
}

export default function UnitsCmsClient() {
  const [units, setUnits] = useState<Unit[] | null>(null);
  const [selected, setSelected] = useState<UnitDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [role, setRole] = useState<Role>(null);

  useEffect(() => {
    // getFrontendSessionUser returns null for anonymous users; middleware will redirect them
    // before this component renders, but the null check keeps TS happy and stays safe.
    setRole((getFrontendSessionUser()?.role as Role) ?? null);
  }, []);

  async function loadAll() {
    setLoadError(null);
    try {
      const res = await apiClient.get<Unit[]>("/units");
      setUnits(res.data);
      // Refresh the selected unit if it still exists in the list
      if (selected) {
        const stillThere = res.data.find((u) => u.id === selected.id);
        if (stillThere) await loadDetail(selected.id);
        else setSelected(null);
      }
    } catch (err) {
      setLoadError((err as { message?: string }).message ?? "Failed to load");
    }
  }

  async function loadDetail(unitId: string) {
    try {
      const res = await apiClient.get<UnitDetail>(`/units/${unitId}`);
      setSelected(res.data);
    } catch (err) {
      setSelected(null);
      alert((err as { message?: string }).message ?? "Failed to load unit");
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDeleteUnit(u: Unit) {
    if (!confirm(`Delete unit "${u.name}"? This removes all member assignments too.`)) return;
    try {
      await apiClient.delete(`/units/${u.id}`);
      if (selected?.id === u.id) setSelected(null);
      await loadAll();
    } catch (err) {
      alert((err as { message?: string }).message ?? "Delete failed");
    }
  }

  async function handleAddMember(unitId: string, memberId: string, isLead: boolean) {
    try {
      await apiClient.post(`/units/${unitId}/members`, { memberId, isLead });
      await loadDetail(unitId);
      await loadAll();
    } catch (err) {
      throw new Error((err as { message?: string }).message ?? "Add failed");
    }
  }

  async function handleRemoveMember(unitId: string, memberId: string) {
    if (!confirm("Remove this member from the unit?")) return;
    try {
      await apiClient.delete(`/units/${unitId}/members/${memberId}`);
      await loadDetail(unitId);
      await loadAll();
    } catch (err) {
      alert((err as { message?: string }).message ?? "Remove failed");
    }
  }

  async function handleToggleLead(unitId: string, memberId: string, isLead: boolean) {
    try {
      await apiClient.patch(`/units/${unitId}/members/${memberId}/lead`, { isLead });
      await loadDetail(unitId);
    } catch (err) {
      alert((err as { message?: string }).message ?? "Lead toggle failed");
    }
  }

  const canCreateUnit = isAdminPlus(role);
  const canDeleteUnit = isAdminPlus(role);
  const canPromoteLead = isAdminPlus(role);

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Units</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {units ? `${units.length} unit${units.length !== 1 ? "s" : ""}` : "Loading…"}
            {role === "UNIT_LEAD" && " — you can add/remove members in units you lead"}
          </p>
        </div>
        {canCreateUnit && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
          >
            <Plus size={15} />
            New unit
          </button>
        )}
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
          {loadError}
        </div>
      )}

      {creating && (
        <CreateUnitForm
          onCancel={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            await loadAll();
          }}
        />
      )}

      {/* Skeleton */}
      {units === null && !loadError && <SkeletonGrid />}

      {/* Empty state */}
      {units !== null && units.length === 0 && !creating && (
        <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center">
          <Network size={28} className="text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No units yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {canCreateUnit
              ? `Click "New unit" to set up your first department or cell group.`
              : `Ask an admin to set up units for your church.`}
          </p>
        </div>
      )}

      {/* Master-detail */}
      {units !== null && units.length > 0 && (
        <div className="grid lg:grid-cols-5 gap-5">
          {/* LEFT: unit list */}
          <div className="lg:col-span-2 space-y-2">
            {units.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => loadDetail(u.id)}
                className={`w-full text-left px-4 py-4 rounded-xl border transition-all ${
                  selected?.id === u.id
                    ? "border-[#87102C]/40 bg-[#87102C]/5 dark:bg-[#87102C]/10"
                    : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] hover:border-[#87102C]/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {u.name}
                    </p>
                    {u.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {u.description}
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
                      {u._count.UnitMember} member{u._count.UnitMember !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`flex-shrink-0 mt-1 transition-colors ${
                      selected?.id === u.id ? "text-[#87102C]" : "text-gray-300"
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* RIGHT: detail panel */}
          <div className="lg:col-span-3">
            {selected ? (
              <UnitDetailPanel
                unit={selected}
                role={role}
                canDelete={canDeleteUnit}
                canPromoteLead={canPromoteLead}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
                onToggleLead={handleToggleLead}
                onDeleteUnit={handleDeleteUnit}
              />
            ) : (
              <div className="h-full min-h-[300px] flex items-center justify-center bg-white dark:bg-[#1c1c1e] border border-dashed border-gray-200 dark:border-white/10 rounded-xl text-center px-6">
                <div>
                  <Network size={24} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Pick a unit on the left to see its members.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detail panel ─────────────────────────────────────────────────────────────

interface DetailProps {
  unit: UnitDetail;
  role: Role;
  canDelete: boolean;
  canPromoteLead: boolean;
  onAddMember: (unitId: string, memberId: string, isLead: boolean) => Promise<void>;
  onRemoveMember: (unitId: string, memberId: string) => Promise<void>;
  onToggleLead: (unitId: string, memberId: string, isLead: boolean) => Promise<void>;
  onDeleteUnit: (u: Unit) => Promise<void>;
}

function UnitDetailPanel({
  unit,
  role,
  canDelete,
  canPromoteLead,
  onAddMember,
  onRemoveMember,
  onToggleLead,
  onDeleteUnit,
}: DetailProps) {
  const [showAdd, setShowAdd] = useState(false);
  const lead = unit.UnitMember.find((m) => m.isLead);

  return (
    <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-100 dark:border-white/8 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
            {unit.name}
          </h2>
          {unit.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{unit.description}</p>
          )}
          {lead && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 inline-flex items-center gap-1.5 font-semibold">
              <Crown size={11} />
              Led by {lead.Member.firstName} {lead.Member.lastName}
            </p>
          )}
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={() => onDeleteUnit(unit)}
            title="Delete unit"
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Member list */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">
            Members ({unit.UnitMember.length})
          </p>
          {!showAdd && (
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#87102C] hover:text-[#6E0C24] transition-colors"
            >
              <UserPlus size={13} />
              Add member
            </button>
          )}
        </div>

        {showAdd && (
          <AddMemberForm
            unitId={unit.id}
            existingMemberIds={unit.UnitMember.map((m) => m.memberId)}
            canPromoteLead={canPromoteLead}
            onCancel={() => setShowAdd(false)}
            onAdded={async (memberId, isLead) => {
              try {
                await onAddMember(unit.id, memberId, isLead);
                setShowAdd(false);
              } catch (e) {
                alert((e as Error).message);
              }
            }}
          />
        )}

        {unit.UnitMember.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
            No members in this unit yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {unit.UnitMember.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-white/8 bg-gray-50/50 dark:bg-white/[0.02]"
              >
                {m.Member.photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={m.Member.photoUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-[#87102C]/10 dark:bg-[#87102C]/20 text-[#87102C] dark:text-[#e8768a] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {m.Member.firstName[0]?.toUpperCase()}
                    {m.Member.lastName[0]?.toUpperCase()}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {m.Member.firstName} {m.Member.lastName}
                    {m.isLead && (
                      <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                        <Crown size={9} />
                        Lead
                      </span>
                    )}
                  </p>
                  {m.Member.email && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {m.Member.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canPromoteLead && (
                    <button
                      type="button"
                      onClick={() => onToggleLead(unit.id, m.memberId, !m.isLead)}
                      title={m.isLead ? "Demote lead" : "Promote to lead"}
                      className={`p-1.5 rounded-lg transition-colors ${
                        m.isLead
                          ? "text-emerald-600 hover:bg-gray-100 dark:hover:bg-white/5"
                          : "text-gray-400 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-white/5"
                      }`}
                    >
                      <Crown size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveMember(unit.id, m.memberId)}
                    title="Remove from unit"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <UserMinus size={13} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Add member sub-form ──────────────────────────────────────────────────────

interface AddMemberFormProps {
  unitId: string;
  existingMemberIds: string[];
  canPromoteLead: boolean;
  onCancel: () => void;
  onAdded: (memberId: string, isLead: boolean) => Promise<void>;
}

function AddMemberForm({
  existingMemberIds,
  canPromoteLead,
  onCancel,
  onAdded,
}: AddMemberFormProps) {
  const [allMembers, setAllMembers] = useState<MemberRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [makeLead, setMakeLead] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<MemberRow[]>("/members?status=ACTIVE");
        setAllMembers(res.data);
      } catch {
        setError("Couldn't load members. You may not have permission to list them.");
      }
    })();
  }, []);

  const candidates = useMemo(() => {
    if (!allMembers) return [];
    const q = search.trim().toLowerCase();
    return allMembers
      .filter((m) => !existingMemberIds.includes(m.id))
      .filter((m) =>
        q
          ? `${m.firstName} ${m.lastName} ${m.email ?? ""}`.toLowerCase().includes(q)
          : true,
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
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-700 p-0.5"
          aria-label="Close"
        >
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

      {allMembers === null && (
        <p className="text-xs text-gray-400 italic">Loading members…</p>
      )}

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
                {m.email && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">{m.email}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {allMembers !== null && candidates.length === 0 && search && (
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
          <span className="text-xs text-gray-700 dark:text-gray-300">
            Add as the unit lead
          </span>
        </label>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded px-2 py-1.5">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!selectedId || saving}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#87102C] text-white text-xs font-bold hover:bg-[#6E0C24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Adding…" : "Add to unit"}
        </button>
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

// ── Create unit form ─────────────────────────────────────────────────────────

interface CreateUnitFormProps {
  onCancel: () => void;
  onCreated: () => Promise<void>;
}

function CreateUnitForm({ onCancel, onCreated }: CreateUnitFormProps) {
  const [data, setData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiClient.post("/units", {
        name: data.name.trim(),
        ...(data.description.trim() && { description: data.description.trim() }),
      });
      await onCreated();
    } catch (err) {
      setError((err as { message?: string }).message ?? "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 rounded-xl p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">New unit</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-700 p-1"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      <input
        required
        type="text"
        value={data.name}
        onChange={(e) => setData({ ...data, name: e.target.value })}
        placeholder="Unit name (e.g. Hospitality)"
        maxLength={80}
        className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
      />
      <input
        type="text"
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        placeholder="Description (optional)"
        maxLength={400}
        className="w-full text-sm rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all"
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded px-2 py-1.5">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving || !data.name.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#87102C] text-white text-xs font-bold hover:bg-[#6E0C24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Creating…" : "Create unit"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid lg:grid-cols-5 gap-5">
      <div className="lg:col-span-2 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1c1c1e] animate-pulse"
          >
            <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded mb-2" />
            <div className="h-3 w-40 bg-gray-200 dark:bg-white/10 rounded mb-2" />
            <div className="h-2 w-16 bg-gray-200 dark:bg-white/10 rounded" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-3 min-h-[300px] rounded-xl border border-dashed border-gray-200 dark:border-white/10" />
    </div>
  );
}
