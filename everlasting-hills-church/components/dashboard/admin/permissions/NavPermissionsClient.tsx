"use client";

import { useMemo, useState } from "react";
import { Loader2, Lock, RotateCcw, Save, ShieldCheck, X } from "lucide-react";
import { NAV_GROUPS, type NavItem, type UserRole } from "@/config/config";
import {
  PERMISSION_ROLE_OPTIONS,
  effectiveRolesForItem,
  toNavPermissionsMap,
  useNavPermissions,
  useResetNavPermission,
  useSaveNavPermissions,
  type NavPermissionEntry,
} from "@/lib/nav-permissions";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import NavGrantsSection from "./NavGrantsSection";

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

export default function NavPermissionsClient() {
  const { data, isLoading } = useNavPermissions();
  const save = useSaveNavPermissions();
  const reset = useResetNavPermission();

  const serverOverrides = useMemo(() => toNavPermissionsMap(data ?? []), [data]);
  const [pending, setPending] = useState<Map<string, UserRole[]>>(new Map());
  const [resettingHref, setResettingHref] = useState<string | null>(null);

  const rolesFor = (item: NavItem): UserRole[] => pending.get(item.href) ?? effectiveRolesForItem(item, serverOverrides);

  const toggleRole = (item: NavItem, roleOption: (typeof PERMISSION_ROLE_OPTIONS)[number]) => {
    if (roleOption.locked) return;
    const current = rolesFor(item);
    const affected = [roleOption.role, ...(roleOption.impliedRoles ?? [])];
    const hasRole = current.includes(roleOption.role);
    const next = hasRole
      ? current.filter((r) => !affected.includes(r))
      : Array.from(new Set([...current, ...affected]));
    setPending((prev) => new Map(prev).set(item.href, next));
  };

  const discardItem = (href: string) => {
    setPending((prev) => {
      const next = new Map(prev);
      next.delete(href);
      return next;
    });
  };

  const handleReset = async (href: string) => {
    setResettingHref(href);
    try {
      await reset.mutateAsync(href);
      discardItem(href);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't reset this item"));
    } finally {
      setResettingHref(null);
    }
  };

  const handleSaveAll = async () => {
    const items: NavPermissionEntry[] = Array.from(pending, ([itemHref, roles]) => ({ itemHref, roles }));
    if (items.length === 0) return;
    try {
      await save.mutateAsync(items);
      setPending(new Map());
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't save permissions"));
    }
  };

  const isCustomized = (item: NavItem) => pending.has(item.href) || serverOverrides.has(item.href);
  const isDirty = (item: NavItem) => {
    const p = pending.get(item.href);
    if (!p) return false;
    const saved = effectiveRolesForItem(item, serverOverrides);
    return p.length !== saved.length || !p.every((r) => saved.includes(r));
  };

  return (
    <div className="max-w-full space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Role Access Permissions</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-white/50">
            Choose exactly who can see and open each section. Unchecking a role both hides the sidebar link and
            blocks the page for that role. Super Admin always has access, everywhere, as a safety net.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {NAV_GROUPS.map((group, idx) => (
            <section
              key={`${group.section ?? "general"}-${idx}`}
              className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5"
            >
              <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-white/50">
                {group.section ?? "General"}
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10">
                      <th className="py-2 pr-4 font-bold text-gray-500 dark:text-white/50">Section item</th>
                      {PERMISSION_ROLE_OPTIONS.map((opt) => (
                        <th key={opt.role} className="px-2 py-2 text-center font-bold text-gray-500 dark:text-white/50">
                          {opt.label}
                        </th>
                      ))}
                      <th className="py-2 pl-4 font-bold text-gray-500 dark:text-white/50" />
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item) => {
                      const current = rolesFor(item);
                      const dirty = isDirty(item);
                      const customized = isCustomized(item);
                      return (
                        <tr
                          key={item.href}
                          className={`border-b border-gray-100 last:border-0 dark:border-white/5 ${dirty ? "bg-amber-50/60 dark:bg-amber-500/[0.06]" : ""}`}
                        >
                          <td className="py-2.5 pr-4">
                            <p className="font-semibold text-gray-800 dark:text-white/80">{item.label}</p>
                            <p className="font-mono text-[10px] text-gray-400 dark:text-white/30">{item.href}</p>
                          </td>
                          {PERMISSION_ROLE_OPTIONS.map((opt) => {
                            const checked = current.includes(opt.role);
                            return (
                              <td key={opt.role} className="px-2 py-2.5 text-center">
                                {opt.locked ? (
                                  <span
                                    className="inline-flex items-center justify-center text-[#87102C] dark:text-[#e8768a]"
                                    title="Super Admin always has access"
                                  >
                                    <Lock size={13} />
                                  </span>
                                ) : (
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleRole(item, opt)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#87102C] focus:ring-[#87102C] dark:border-white/20 dark:bg-white/10"
                                  />
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2.5 pl-4 text-right">
                            {customized && (
                              <button
                                type="button"
                                disabled={resettingHref === item.href}
                                onClick={() => handleReset(item.href)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-gray-400 hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50 dark:hover:bg-white/5"
                                title={`Revert "${item.label}" to default access`}
                              >
                                {resettingHref === item.href ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <RotateCcw size={12} />
                                )}
                                Default
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      <NavGrantsSection />

      {pending.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-6 py-3 backdrop-blur dark:border-white/10 dark:bg-[#0f0f10]/95">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-white/60">
              <ShieldCheck size={14} className="text-[#87102C] dark:text-[#e8768a]" />
              {pending.size} item{pending.size === 1 ? "" : "s"} changed
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPending(new Map())}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <X size={13} /> Discard
              </button>
              <button
                type="button"
                disabled={save.isPending}
                onClick={handleSaveAll}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#87102C] px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#6E0C24] disabled:opacity-60"
              >
                {save.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
