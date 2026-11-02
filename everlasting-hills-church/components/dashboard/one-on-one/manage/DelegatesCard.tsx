"use client";

import { useState } from "react";
import { UserCheck, X } from "lucide-react";
import { useAddDelegate, usePeopleSearch, useRemoveDelegate, type HostDetail } from "@/lib/api/one-on-one";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { errorText } from "@/components/pray-watch/shared";
import { Section, btnGhost, input, label, muted } from "./ui";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function DelegatesCard({ host }: { host: HostDetail }) {
  const add = useAddDelegate(host.id);
  const remove = useRemoveDelegate(host.id);
  const [query, setQuery] = useState("");
  const search = usePeopleSearch(host.canAppointDelegates ? query : "");
  const [removing, setRemoving] = useState<HostDetail["delegates"][number] | null>(null);

  const existing = new Set(host.delegates.map((d) => d.profileId));
  const results = (search.data ?? []).filter((p) => !existing.has(p.profileId));

  async function onAdd(profileId: string, name: string) {
    try {
      await add.mutateAsync(profileId);
      setQuery("");
      showToast.success(`${name} can now manage these sessions`);
    } catch (err) {
      showToast.error(errorText(err, "Couldn't add that delegate."));
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      showToast.success(`${removing.name} removed`);
      setRemoving(null);
    } catch (err) {
      showToast.error(errorText(err, "Couldn't remove that delegate."));
    }
  }

  return (
    <Section icon={UserCheck} eyebrow="Help with scheduling" title="Delegates">
      <p className={`mb-4 text-sm ${muted}`}>
        A delegate can approve requests, suggest other times and edit these hours for {host.displayName}. They never see the private
        notes people write.
      </p>

      {host.delegates.length === 0 ? (
        <p className={`text-sm ${muted}`}>No delegates yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[#E7CDD3]/50 dark:divide-white/[0.07]">
          {host.delegates.map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-2.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#FFE8ED] text-xs font-bold text-[#87102C] dark:bg-[#87102C]/25 dark:text-[#FFB3C1]">
                {initials(d.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#111] dark:text-white">{d.name}</p>
                {d.email && <p className={`truncate text-xs ${muted}`}>{d.email}</p>}
              </div>
              {host.canAppointDelegates && (
                <button type="button" className={`${btnGhost} px-2.5 py-1 text-xs`} onClick={() => setRemoving(d)}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {host.canAppointDelegates && (
        <div className="mt-4 flex flex-col gap-1.5">
          <label htmlFor="delegate-search" className={label}>
            Add a delegate
          </label>
          <div className="relative">
            <input
              id="delegate-search"
              type="search"
              className={input}
              placeholder="Search by name or email"
              value={query}
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#8a7e80] hover:text-[#87102C]"
                onClick={() => setQuery("")}
              >
                <X size={14} />
              </button>
            )}
          </div>
          {query.trim().length >= 2 && (
            <ul className="mt-1 overflow-hidden rounded-xl border border-[#E7CDD3]/70 dark:border-white/10">
              {search.isLoading && <li className={`px-3 py-2.5 text-sm ${muted}`}>Searching…</li>}
              {!search.isLoading && results.length === 0 && <li className={`px-3 py-2.5 text-sm ${muted}`}>No one found with that name or email.</li>}
              {results.map((p) => (
                <li key={p.profileId} className="border-t border-[#E7CDD3]/50 first:border-t-0 dark:border-white/[0.07]">
                  <button
                    type="button"
                    disabled={add.isPending}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[#FFE8ED]/50 dark:hover:bg-white/[0.05]"
                    onClick={() => onAdd(p.profileId, p.name)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#111] dark:text-white">{p.name}</span>
                      {p.email && <span className={`block truncate text-xs ${muted}`}>{p.email}</span>}
                    </span>
                    <span className="text-xs font-semibold text-[#87102C] dark:text-[#FFB3C1]">Add</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!removing}
        title="Remove this delegate?"
        description={removing ? `${removing.name} will no longer be able to manage ${host.displayName}'s sessions.` : ""}
        confirmLabel="Remove"
        tone="danger"
        loading={remove.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </Section>
  );
}
