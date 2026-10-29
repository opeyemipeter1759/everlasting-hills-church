"use client";

import { useMemo, useState } from "react";
import { Download, Loader2, MessageCircle, Printer, RefreshCw, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { userMessageForError } from "@/lib/api/user-message";
import {
  useAdminPrayerWatch,
  useAdminReflections,
  useDecideFamilyChange,
  useFamilyChangeRequests,
  usePrayerSignupList,
  useRemoveAdminReflection,
  useRemovePrayerSignup,
  useSetSlotLeader,
  useSetSlotWhatsappLink,
  type AdminReflection,
  type SignupListRow,
} from "@/lib/api/prayer-watch";

function csvCell(value: string | number | null) {
  let text = value == null ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadCsv(rows: SignupListRow[], watchTitle: string) {
  const header = ["Name", "Phone", "Email", "Worker/Member", "Leader", "Slot", "Signed up"];
  const lines = [
    header,
    ...rows.map((r) => [r.fullName, r.phone, r.email ?? "", r.isWorker ? "Worker" : "Member", r.isLeader ? "Yes" : "", r.slotTime, r.createdAt]),
  ];
  const csv = lines.map((row) => row.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${watchTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-signups.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export default function PrayerWatchOverview() {
  const watch = useAdminPrayerWatch();
  const signupList = usePrayerSignupList();
  const reflections = useAdminReflections();
  const removeSignup = useRemovePrayerSignup();
  const removeReflection = useRemoveAdminReflection();
  const familyChangeRequests = useFamilyChangeRequests();
  const decideFamilyChange = useDecideFamilyChange();
  const setLeader = useSetSlotLeader();
  const setWhatsappLink = useSetSlotWhatsappLink();

  const [search, setSearch] = useState("");
  const [removing, setRemoving] = useState<SignupListRow | null>(null);
  const [removingReflection, setRemovingReflection] = useState<AdminReflection | null>(null);
  const [linkDrafts, setLinkDrafts] = useState<Record<string, string>>({});
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const data = watch.data;

  const filteredSignups = useMemo(() => {
    const rows = signupList.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) => r.fullName.toLowerCase().includes(term) || r.phone.includes(term) || r.slotLabel.toLowerCase().includes(term),
    );
  }, [signupList.data, search]);

  async function confirmRemove() {
    if (!removing) return;
    try {
      await removeSignup.mutateAsync(removing.id);
      showToast.success(`${removing.fullName} removed`);
      setRemoving(null);
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't remove this sign-up"));
    }
  }

  async function confirmRemoveReflection() {
    if (!removingReflection) return;
    try {
      await removeReflection.mutateAsync(removingReflection.id);
      showToast.success("Removed");
      setRemovingReflection(null);
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't remove this"));
    }
  }

  async function handleDecideFamilyChange(id: string, approve: boolean) {
    setDecidingId(id);
    try {
      await decideFamilyChange.mutateAsync({ id, approve });
      showToast.success(approve ? "Request approved" : "Request declined");
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't decide this request"));
    } finally {
      setDecidingId(null);
    }
  }

  async function handleSetLeader(slotId: string, signupId: string | null) {
    try {
      await setLeader.mutateAsync({ slotId, signupId });
      showToast.success(signupId ? "Watch leader set" : "Watch leader cleared");
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't update the watch leader"));
    }
  }

  function linkDraftFor(slotId: string, saved: string | null) {
    return linkDrafts[slotId] ?? saved ?? "";
  }

  async function handleSaveWhatsappLink(slotId: string, saved: string | null) {
    const draft = linkDraftFor(slotId, saved).trim();
    if (draft === (saved ?? "")) return;
    setSavingSlotId(slotId);
    try {
      await setWhatsappLink.mutateAsync({ slotId, whatsappLink: draft });
      showToast.success(draft ? "WhatsApp group saved" : "WhatsApp group cleared");
      setLinkDrafts((prev) => {
        const next = { ...prev };
        delete next[slotId];
        return next;
      });
    } catch (err) {
      showToast.error(userMessageForError(err, "Couldn't save that link"));
    } finally {
      setSavingSlotId(null);
    }
  }

  return (
    <div className="space-y-8 px-5 print:px-0">
      <header className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1210] dark:text-white">Prayer Watch</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500 dark:text-white/55">
            Who&apos;s signed up for the overnight watch, slot by slot. Click the crown to make someone the watch leader for their hour.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => data && downloadCsv(signupList.data ?? [], data.title)}
            disabled={!data}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#87102C] px-3.5 text-sm font-semibold text-white hover:bg-[#6f0d24] disabled:opacity-50"
          >
            <Download size={15} aria-hidden="true" />
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            <Printer size={15} aria-hidden="true" />
            Print schedule
          </button>
          <button
            type="button"
            onClick={() => {
              watch.refetch();
              signupList.refetch();
            }}
            disabled={watch.isFetching || signupList.isFetching}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
          >
            {watch.isFetching || signupList.isFetching ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Refresh
          </button>
        </div>
      </header>

      {watch.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : watch.isError || !data ? (
        <div role="alert" className="rounded-xl border border-red-200 p-5 text-sm text-gray-700 dark:border-red-900 dark:text-white/75">
          Couldn&apos;t load the watch.{" "}
          <button type="button" onClick={() => watch.refetch()} className="font-semibold underline">
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Requests to change Prayer Watchmen Family — reviewed, not instant. */}
          {familyChangeRequests.data && familyChangeRequests.data.length > 0 && (
            <section className="print:hidden">
              <h2 className="text-base font-bold text-[#1A1210] dark:text-white">Prayer Watchmen Family change requests</h2>
              <p className="mb-3 text-sm text-gray-400">Approving moves their sign-up; declining leaves them where they are.</p>
              <div className="space-y-2">
                {familyChangeRequests.data.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 dark:border-white/10">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {r.fullName}: {r.fromSlotTime} ({r.fromSlotLabel}) → {r.toSlotTime} ({r.toSlotLabel})
                      </p>
                      {r.reason && <p className="mt-1 text-xs text-gray-500 dark:text-white/50">&ldquo;{r.reason}&rdquo;</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecideFamilyChange(r.id, true)}
                        disabled={decidingId === r.id}
                        className="inline-flex min-h-9 items-center rounded-lg bg-[#87102C] px-3 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecideFamilyChange(r.id, false)}
                        disabled={decidingId === r.id}
                        className="inline-flex min-h-9 items-center rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 disabled:opacity-50 dark:border-white/10 dark:text-white/70"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* The timeline — four connected blocks, filled proportionally, with names
              and a crown to pick that slot's watch leader from its own sign-ups. */}
          <section>
            <h2 className="text-base font-bold text-[#1A1210] dark:text-white print:text-black">Prayer Watch hours</h2>
            <p className="mb-3 text-sm text-gray-400">People of His watch, hour by hour.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.slots.map((s) => {
                return (
                  <div key={s.id} className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm font-semibold tabular-nums text-[#1A1210] dark:text-white">
                        {s.startTime}–{s.endTime}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        {s.signups.length} {s.signups.length === 1 ? "person" : "people"}
                      </span>
                    </div>
                    <div className="space-y-1.5 border-t border-gray-100 px-4 py-3 dark:border-white/5">
                      {s.signups.length === 0 ? (
                        <p className="text-xs text-gray-400">No one yet.</p>
                      ) : (
                        s.signups.map((p) => {
                          const isLeader = p.id === s.leaderId;
                          return (
                            <div key={p.id} className="flex items-center justify-between gap-2">
                              <p className="min-w-0 truncate text-sm text-gray-700 dark:text-white/75">{p.fullName}</p>
                              {isLeader ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetLeader(s.id, null)}
                                  disabled={setLeader.isPending}
                                  aria-label={`Remove ${p.fullName} as watch leader`}
                                  className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 hover:bg-amber-200 print:bg-transparent print:px-0 print:text-gray-500 dark:bg-amber-500/15 dark:text-amber-300 dark:hover:bg-amber-500/25"
                                >
                                  Leader ×
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetLeader(s.id, p.id)}
                                  disabled={setLeader.isPending}
                                  aria-label={`Make ${p.fullName} the watch leader`}
                                  className="shrink-0 whitespace-nowrap text-[11px] font-semibold text-gray-400 hover:text-[#87102C] print:hidden dark:text-white/30 dark:hover:text-[#e8768a]"
                                >
                                  Make leader
                                </button>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 border-t border-gray-100 px-4 py-2.5 print:hidden dark:border-white/5">
                      <MessageCircle size={13} className="shrink-0 text-gray-400" aria-hidden="true" />
                      <input
                        value={linkDraftFor(s.id, s.whatsappLink)}
                        onChange={(e) => setLinkDrafts((prev) => ({ ...prev, [s.id]: e.target.value }))}
                        onBlur={() => handleSaveWhatsappLink(s.id, s.whatsappLink)}
                        placeholder="Prayer Watchmen Family WhatsApp link"
                        className="min-w-0 flex-1 bg-transparent text-xs text-gray-600 outline-none placeholder:text-gray-300 dark:text-white/65 dark:placeholder:text-white/20"
                      />
                      {savingSlotId === s.id && <Loader2 size={12} className="shrink-0 animate-spin text-gray-400" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Sign-up table — searchable, slot shown as plain text (the hour they
              chose), not an editable control. */}
          <section className="print:hidden">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-[#1A1210] dark:text-white">Sign-ups</h2>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, or slot"
                className="min-h-10 w-full max-w-xs rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-[#87102C] dark:border-white/10 dark:bg-white/5 dark:text-white"
              />
            </div>

            {signupList.isLoading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                ))}
              </div>
            ) : filteredSignups.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
                No sign-ups {search ? "match that search" : "yet"}.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-white/50">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Worker/Member</th>
                      <th className="px-4 py-3">Slot</th>
                      <th className="px-4 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredSignups.map((r) => (
                      <tr key={r.id} className="align-top text-gray-700 dark:text-white/80">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          <span className="flex items-center gap-2">
                            {r.fullName}
                            {r.isLeader && (
                              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                Leader
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3">{r.phone}</td>
                        <td className="px-4 py-3">{r.isWorker ? "Worker" : "Member"}</td>
                        <td className="px-4 py-3 tabular-nums text-gray-500 dark:text-white/55">{r.slotTime}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setRemoving(r)}
                            aria-label={`Remove ${r.fullName}`}
                            className="rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* What members sensed God say once their hour passed — a running
              record, not tied to any one watch. */}
          <section className="print:hidden">
            <h2 className="text-base font-bold text-[#1A1210] dark:text-white">What members heard from God</h2>
            <p className="mb-3 text-sm text-gray-400">Shared after their watch hour — what they sensed Him say.</p>

            {reflections.isLoading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                ))}
              </div>
            ) : (reflections.data ?? []).length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-500 dark:border-white/10 dark:text-white/50">
                Nothing shared yet.
              </p>
            ) : (
              <div className="space-y-3">
                {reflections.data!.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#E7CDD3]/60 bg-[#FFF4F6]/50 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="min-w-0">
                      <p className="text-sm leading-relaxed text-[#6E0C24] dark:text-white/80">&ldquo;{r.body}&rdquo;</p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-white/45">
                        {r.fullName} · {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRemovingReflection(r)}
                      aria-label={`Remove this entry from ${r.fullName}`}
                      className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <ConfirmDialog
            open={!!removing}
            title="Remove this sign-up?"
            description={removing ? `${removing.fullName} (${removing.slotTime}) will be removed from the watch.` : ""}
            confirmLabel="Yes, remove"
            tone="danger"
            loading={removeSignup.isPending}
            onConfirm={confirmRemove}
            onCancel={() => setRemoving(null)}
          />

          <ConfirmDialog
            open={!!removingReflection}
            title="Remove this entry?"
            description={removingReflection ? `This word from ${removingReflection.fullName} will be removed.` : ""}
            confirmLabel="Yes, remove"
            tone="danger"
            loading={removeReflection.isPending}
            onConfirm={confirmRemoveReflection}
            onCancel={() => setRemovingReflection(null)}
          />
        </>
      )}
    </div>
  );
}
