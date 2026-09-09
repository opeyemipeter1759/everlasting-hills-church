"use client";

import { useMemo, useState } from "react";
import { Loader2, Trash2, UserPlus, Users, Crown } from "lucide-react";
import { NAV_GROUPS } from "@/config/config";
import {
  NAV_GRANT_TYPE_LABELS,
  useAddNavGrant,
  useNavGrants,
  useRemoveNavGrant,
  type NavGrantType,
} from "@/lib/nav-permissions";
import { useUnitOptions } from "@/lib/api/people";
import HeadPicker, { Avatar } from "../departments/HeadPicker";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

const TYPE_ICON: Record<NavGrantType, React.ElementType> = {
  MEMBER: UserPlus,
  UNIT_MEMBER: Users,
  UNIT_LEAD: Crown,
};

export default function NavGrantsSection() {
  const grants = useNavGrants();
  const units = useUnitOptions();
  const addGrant = useAddNavGrant();
  const removeGrant = useRemoveNavGrant();

  const hrefToLabel = useMemo(
    () => new Map(NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.href, i.label]))),
    [],
  );
  const allItems = useMemo(
    () => NAV_GROUPS.map((g) => ({ section: g.section ?? "General", items: g.items })),
    [],
  );

  const [itemHref, setItemHref] = useState(allItems[0]?.items[0]?.href ?? "");
  const [type, setType] = useState<NavGrantType>("MEMBER");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetLabel, setTargetLabel] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);

  const resetTarget = () => {
    setTargetId(null);
    setTargetLabel(null);
  };

  const handleAdd = async () => {
    if (!itemHref || !targetId) return;
    try {
      await addGrant.mutateAsync({ itemHref, type, targetId });
      resetTarget();
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't add that exception"));
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5">
      <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
        Individual &amp; Unit Exceptions
      </h2>
      <p className="mb-4 max-w-2xl text-xs text-gray-500 dark:text-white/50">
        Let one specific person, every member of a unit, or just a unit&apos;s leader into an item — on top of
        whatever the role table above already allows. These only ever add access; to block someone, use the role
        checkboxes instead.
      </p>

      <div className="mb-5 flex flex-wrap items-end gap-2 rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-3">
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Item</label>
          <select
            value={itemHref}
            onChange={(e) => setItemHref(e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-2 text-xs text-gray-800 dark:text-white/80"
          >
            {allItems.map((group) => (
              <optgroup key={group.section} label={group.section}>
                {group.items.map((item) => (
                  <option key={item.href} value={item.href}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="min-w-[170px]">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">Grant to</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as NavGrantType);
              resetTarget();
            }}
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-2 text-xs text-gray-800 dark:text-white/80"
          >
            {(Object.keys(NAV_GRANT_TYPE_LABELS) as NavGrantType[]).map((t) => (
              <option key={t} value={t}>
                {NAV_GRANT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {type === "MEMBER" ? "Person" : "Unit"}
          </label>
          {type === "MEMBER" ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-2 text-left text-xs text-gray-700 dark:text-white/70 hover:border-[#87102C]/30"
            >
              {targetLabel ? (
                <>
                  <Avatar name={targetLabel} photoUrl={null} px={18} />
                  <span className="truncate">{targetLabel}</span>
                </>
              ) : (
                <span className="text-gray-400">Choose a person…</span>
              )}
            </button>
          ) : (
            <select
              value={targetId ?? ""}
              onChange={(e) => {
                const unit = units.data?.find((u) => u.id === e.target.value);
                setTargetId(e.target.value || null);
                setTargetLabel(unit?.name ?? null);
              }}
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-2 text-xs text-gray-800 dark:text-white/80"
            >
              <option value="">Choose a unit…</option>
              {units.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="button"
          disabled={!itemHref || !targetId || addGrant.isPending}
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#87102C] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-50"
        >
          {addGrant.isPending ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
          Add
        </button>
      </div>

      <HeadPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        pending={false}
        title="Choose a person"
        subtitle="They'll get access to this item regardless of their role"
        onPick={(profileId, name) => {
          setTargetId(profileId);
          setTargetLabel(name);
          setPickerOpen(false);
        }}
      />

      {grants.isLoading ? (
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : !grants.data?.length ? (
        <p className="text-xs text-gray-400">No exceptions yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {grants.data.map((g) => {
            const Icon = TYPE_ICON[g.type];
            const isRemoving = removeGrant.isPending && confirmRemoveId === g.id;
            return (
              <li
                key={g.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#87102C]/10 dark:bg-[#87102C]/15">
                  <Icon size={13} className="text-[#87102C] dark:text-[#e8768a]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-gray-800 dark:text-white/80">
                    {g.name ?? <span className="italic text-gray-400">Deleted</span>}
                  </p>
                  <p className="truncate text-[11px] text-gray-400">
                    {NAV_GRANT_TYPE_LABELS[g.type]} · {hrefToLabel.get(g.itemHref) ?? g.itemHref}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={removeGrant.isPending}
                  onClick={() => setConfirmRemoveId(g.id)}
                  className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:hover:bg-rose-500/10"
                  aria-label={`Remove exception for ${g.name ?? "this target"}`}
                >
                  {isRemoving ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!confirmRemoveId}
        title="Remove this exception?"
        description="They'll lose access to this item unless their role already allows it."
        confirmLabel="Yes, remove"
        tone="warning"
        loading={removeGrant.isPending}
        onConfirm={async () => {
          if (!confirmRemoveId) return;
          try {
            await removeGrant.mutateAsync(confirmRemoveId);
            setConfirmRemoveId(null);
          } catch (err) {
            showToast.error(errorMessage(err, "Couldn't remove that exception"));
          }
        }}
        onCancel={() => setConfirmRemoveId(null)}
      />
    </section>
  );
}
