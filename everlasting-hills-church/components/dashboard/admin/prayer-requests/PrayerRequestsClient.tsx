"use client";

import { useState } from "react";
import { Heart, Mail, Phone, RefreshCw, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { usePrayerRequests, useDeletePrayerRequest, type PrayerRequestRow } from "@/lib/api/prayer-requests";
import { Avatar } from "@/components/dashboard/admin/people/peopleShared";
import PrayerRequestsSkeleton from "@/components/ui/skeleton/PrayerRequestsSkeleton";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";

function fmt(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

export default function PrayerRequestsClient() {
  const q = usePrayerRequests();
  const deleteRequest = useDeletePrayerRequest();
  const [confirmTarget, setConfirmTarget] = useState<PrayerRequestRow | null>(null);

  if (q.isLoading) return <PrayerRequestsSkeleton />;

  const requests = q.data ?? [];

  async function handleDelete() {
    if (!confirmTarget) return;
    try {
      await deleteRequest.mutateAsync(confirmTarget.id);
      showToast.success("Prayer request deleted");
      setConfirmTarget(null);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't delete prayer request"));
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Prayer Requests</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            {requests.length} request{requests.length === 1 ? "" : "s"} — signed-in submitters are always identified here, even when marked anonymous.
          </p>
        </div>
        <button
          type="button"
          onClick={() => q.refetch()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <RefreshCw size={12} className={q.isFetching ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {q.isError ? (
        <p className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-400">
          Couldn&apos;t load prayer requests.
        </p>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-12 text-center">
          <Heart size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">No prayer requests yet.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Submissions from the public prayer request form will show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => <RequestCard key={r.id} r={r} onDelete={() => setConfirmTarget(r)} />)}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete prayer request?"
        description="This cannot be undone."
        confirmLabel="Delete request"
        tone="danger"
        loading={deleteRequest.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

function RequestCard({ r, onDelete }: { r: PrayerRequestRow; onDelete: () => void }) {
  const displayName = r.member ? `${r.member.firstName} ${r.member.lastName}` : r.isAnonymous ? "Anonymous" : r.name || "Anonymous";
  const email = r.member?.email ?? (r.isAnonymous ? null : r.email);
  const phone = r.member?.phone ?? (r.isAnonymous ? null : r.phone);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {r.member ? (
            <Avatar firstName={r.member.firstName} lastName={r.member.lastName} photoUrl={r.member.photoUrl} size={36} />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-400">
              <UserRound size={16} />
            </span>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{displayName}</p>
              {r.member && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400" title="Signed in when submitted">
                  <ShieldCheck size={9} /> Verified
                </span>
              )}
              {r.isAnonymous && (
                <span className="rounded-full bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-white/50">
                  Anonymous
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">{fmt(r.submittedAt)}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
          aria-label="Delete prayer request"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>

      <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-white/80">{r.request}</p>

      {(email || phone) && (
        <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 dark:border-white/[0.06] pt-3 text-[12px] text-gray-500 dark:text-white/50">
          {email && <span className="inline-flex items-center gap-1.5"><Mail size={12} /> {email}</span>}
          {phone && <span className="inline-flex items-center gap-1.5"><Phone size={12} /> {phone}</span>}
        </div>
      )}
    </div>
  );
}
