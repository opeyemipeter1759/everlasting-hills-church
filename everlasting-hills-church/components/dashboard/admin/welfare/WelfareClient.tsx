"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Eye,
  HandHeart,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import {
  useWelfareRequests,
  useDeleteWelfareRequest,
  useUpdateWelfareRequestStatus,
  type WelfareRequestRow,
  type WelfareStatus,
} from "@/lib/api/welfare";
import { Avatar } from "@/components/dashboard/admin/people/peopleShared";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { groupByDay } from "@/lib/utils/time";

function fmt(d: string) {
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

const URGENCY_STYLE: Record<string, { label: string; className: string }> = {
  HIGH: { label: "Very urgent", className: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20" },
  MEDIUM: { label: "Somewhat urgent", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
  LOW: { label: "Not urgent", className: "bg-gray-50 text-gray-500 border-gray-200 dark:bg-white/5 dark:text-white/50 dark:border-white/10" },
};

const STATUS_STYLE: Record<WelfareStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  IN_REVIEW: { label: "In review", className: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" },
  RESOLVED: { label: "Resolved", className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" },
  DECLINED: { label: "Declined", className: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/40" },
};

const STATUS_TABS: { label: string; value: WelfareStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "In review", value: "IN_REVIEW" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Declined", value: "DECLINED" },
];

export default function WelfareClient() {
  const q = useWelfareRequests();
  const deleteRequest = useDeleteWelfareRequest();
  const [confirmTarget, setConfirmTarget] = useState<WelfareRequestRow | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WelfareStatus | "">("");

  const requests = q.data ?? [];
  const term = search.trim().toLowerCase();

  const filtered = requests.filter((r) => {
    if (status && r.status !== status) return false;
    if (term) {
      const haystack = `${r.fullName} ${r.email} ${r.phone} ${r.description}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const groups = groupByDay(filtered, (r) => r.submittedAt);
  const counts = {
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    IN_REVIEW: requests.filter((r) => r.status === "IN_REVIEW").length,
    RESOLVED: requests.filter((r) => r.status === "RESOLVED").length,
    DECLINED: requests.filter((r) => r.status === "DECLINED").length,
  };
  const hasFilters = !!(search || status);

  function clearFilters() {
    setSearch("");
    setStatus("");
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    try {
      await deleteRequest.mutateAsync(confirmTarget.id);
      showToast.success("Welfare request deleted");
      setConfirmTarget(null);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't delete welfare request"));
    }
  }

  return (
    <div className="px-5 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] xs:tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
            Administration
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Welfare Requests</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            {counts.PENDING} pending{counts.IN_REVIEW > 0 ? ` · ${counts.IN_REVIEW} in review` : ""}, submissions from the public welfare request form.
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

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, or email…"
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setStatus(t.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                status === t.value
                  ? "bg-[#87102C] text-white"
                  : "border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:border-[#87102C]/30"
              }`}
            >
              {t.label}
              {t.value && counts[t.value] > 0 && (
                <span className={`ml-1.5 ${status === t.value ? "text-white/70" : "text-gray-400 dark:text-white/30"}`}>
                  {counts[t.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : q.isError ? (
        <p className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-400">
          Couldn&apos;t load welfare requests.
        </p>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-5 xs:p-8 sm:p-12 text-center">
          <HandHeart size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">No welfare requests yet.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Submissions from the public welfare request form will show up here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-5 xs:p-8 sm:p-12 text-center">
          <Search size={24} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">No requests match your filters.</p>
          <button type="button" onClick={clearFilters} className="mt-2 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
                {group.label} <span className="font-semibold normal-case text-gray-300 dark:text-white/25">· {group.items.length}</span>
              </h2>
              <div className="space-y-3">
                {group.items.map((r) => (
                  <RequestCard key={r.id} r={r} onDelete={() => setConfirmTarget(r)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete welfare request?"
        description={
          <>
            The request from <span className="font-semibold text-gray-900 dark:text-white">{confirmTarget?.fullName}</span> will
            be permanently removed. This cannot be undone.
          </>
        }
        confirmLabel="Delete request"
        tone="danger"
        loading={deleteRequest.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

function RequestCard({ r, onDelete }: { r: WelfareRequestRow; onDelete: () => void }) {
  const updateStatus = useUpdateWelfareRequestStatus();
  const displayName = r.member ? `${r.member.firstName} ${r.member.lastName}` : r.fullName;
  const email = r.member?.email ?? r.email;
  const phone = r.member?.phone ?? r.phone;
  const urgency = URGENCY_STYLE[r.urgency] ?? URGENCY_STYLE.LOW;
  const statusStyle = STATUS_STYLE[r.status];

  async function setStatus(status: WelfareStatus) {
    try {
      await updateStatus.mutateAsync({ id: r.id, status });
      showToast.success(`Marked ${STATUS_STYLE[status].label.toLowerCase()}`);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't update status"));
    }
  }

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-[#161618] p-5 space-y-3 ${
        r.status === "PENDING"
          ? "border-l-4 border-l-amber-400 border-gray-200 dark:border-l-amber-500 dark:border-white/10"
          : r.urgency === "HIGH" && r.status !== "RESOLVED" && r.status !== "DECLINED"
          ? "border-l-4 border-l-rose-500 border-gray-200 dark:border-l-rose-500 dark:border-white/10"
          : "border-gray-200 dark:border-white/10"
      }`}
    >
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
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{displayName}</p>
              {r.member && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400" title="Signed in when submitted">
                  <ShieldCheck size={9} /> Verified
                </span>
              )}
              <span className="rounded-full bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-gray-500 dark:text-white/50">
                {r.isWorkerInChurch ? "Worker" : "Not a worker"}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">{fmt(r.submittedAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusStyle.className}`}>
            {statusStyle.label}
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
            aria-label="Delete welfare request"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:text-white/60">
          {r.category}
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${urgency.className}`}>
          {urgency.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 dark:text-white/50">
        <span>Attending {r.attendanceLength}</span>
        <span>{r.occupation}</span>
        <span>{r.address}</span>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-white/80">{r.description}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 dark:border-white/[0.06] pt-3">
        {(email || phone) ? (
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-gray-500 dark:text-white/50">
            {email && <span className="inline-flex items-center gap-1.5"><Mail size={12} /> {email}</span>}
            {phone && <span className="inline-flex items-center gap-1.5"><Phone size={12} /> {phone}</span>}
          </div>
        ) : <span />}

        <div className="flex flex-wrap items-center gap-1.5">
          {r.status === "PENDING" && (
            <button
              type="button"
              onClick={() => setStatus("IN_REVIEW")}
              disabled={updateStatus.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              <Eye size={13} /> Start review
            </button>
          )}
          {(r.status === "PENDING" || r.status === "IN_REVIEW") && (
            <>
              <button
                type="button"
                onClick={() => setStatus("RESOLVED")}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle2 size={13} /> Mark resolved
              </button>
              <button
                type="button"
                onClick={() => setStatus("DECLINED")}
                disabled={updateStatus.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-white/60 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
              >
                <XCircle size={13} /> Decline
              </button>
            </>
          )}
          {(r.status === "RESOLVED" || r.status === "DECLINED") && (
            <button
              type="button"
              onClick={() => setStatus("PENDING")}
              disabled={updateStatus.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-bold text-gray-500 dark:text-white/60 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
            >
              <Clock size={13} /> Reopen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
