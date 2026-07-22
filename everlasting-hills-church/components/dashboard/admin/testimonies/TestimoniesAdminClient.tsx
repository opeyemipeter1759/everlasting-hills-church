"use client";

import { useState } from "react";
import { CheckCircle2, Clock, MessageSquare, RefreshCw, Search, Trash2, X } from "lucide-react";
import { useAdminTestimonials, useDeleteTestimonial, useTogglePublishTestimonial, type AdminTestimonial } from "@/lib/api/testimonials";
import { Avatar } from "@/components/dashboard/admin/departments/HeadPicker";
import TestimoniesSkeleton from "@/components/ui/skeleton/TestimoniesSkeleton";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";
import { groupByDay } from "@/lib/utils/time";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hasMinRole } from "@/lib/auth/frontend-session";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

type StatusFilter = "" | "PUBLISHED" | "DRAFT";

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Draft", value: "DRAFT" },
];

export default function TestimoniesAdminClient() {
  const q = useAdminTestimonials();
  const deleteTestimonial = useDeleteTestimonial();
  const currentUser = useCurrentUser();
  const [confirmTarget, setConfirmTarget] = useState<AdminTestimonial | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  if (q.isLoading) return <TestimoniesSkeleton />;

  // Backend gates publish/unpublish at PASTOR+ — hide the toggle for plain
  // ADMIN viewers of this page rather than let them hit a 403.
  const canTogglePublish = hasMinRole(currentUser?.role, "PASTOR");

  const testimonials = q.data ?? [];
  const term = search.trim().toLowerCase();
  const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
  const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;

  const filtered = testimonials.filter((t) => {
    if (status === "PUBLISHED" && !t.published) return false;
    if (status === "DRAFT" && t.published) return false;
    const created = new Date(t.createdAt);
    if (from && created < from) return false;
    if (to && created > to) return false;
    if (term) {
      const haystack = `${t.content} ${t.authorName} ${t.authorRole ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const groups = groupByDay(filtered, (t) => t.createdAt);
  const hasFilters = !!(search || status || dateFrom || dateTo);

  function clearFilters() {
    setSearch("");
    setStatus("");
    setDateFrom("");
    setDateTo("");
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    try {
      await deleteTestimonial.mutateAsync(confirmTarget.id);
      showToast.success("Testimonial deleted");
      setConfirmTarget(null);
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't delete testimonial"));
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Testimonies</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-white/50">
            {testimonials.length} testimonial{testimonials.length === 1 ? "" : "s"} — publishing and editing happen on the Pastor Testimonials page.
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
              placeholder="Search testimonials or authors…"
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-2 pl-9 pr-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-2 text-xs font-semibold text-gray-600 dark:text-white/70 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-2 text-xs font-semibold text-gray-600 dark:text-white/70 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20"
          />
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
            </button>
          ))}
        </div>
      </div>

      {q.isError ? (
        <p className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-400">
          Couldn&apos;t load testimonials.
        </p>
      ) : testimonials.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-12 text-center">
          <MessageSquare size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">No testimonials yet.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Submissions from the public testimony form will show up here as drafts.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-white/15 bg-gray-50/60 dark:bg-white/[0.02] p-12 text-center">
          <Search size={24} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-base font-semibold text-gray-700 dark:text-white/80">No testimonials match your filters.</p>
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
                {group.items.map((t) => (
                  <TestimonialCard key={t.id} t={t} canTogglePublish={canTogglePublish} onDelete={() => setConfirmTarget(t)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title="Delete testimonial?"
        description={confirmTarget ? `${confirmTarget.authorName}'s testimonial will be permanently removed. This cannot be undone.` : ""}
        confirmLabel="Delete testimonial"
        tone="danger"
        loading={deleteTestimonial.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

function TestimonialCard({ t, canTogglePublish, onDelete }: { t: AdminTestimonial; canTogglePublish: boolean; onDelete: () => void }) {
  const togglePublish = useTogglePublishTestimonial();

  async function toggleStatus() {
    try {
      await togglePublish.mutateAsync({ id: t.id, published: !t.published });
      showToast.success(t.published ? "Moved to draft" : "Testimonial published");
    } catch (err) {
      showToast.error(errorMessage(err, "Couldn't update status"));
    }
  }

  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-[#161618] p-5 space-y-3 ${
        t.published ? "border-gray-200 dark:border-white/10" : "border-l-4 border-l-amber-400 border-gray-200 dark:border-l-amber-500 dark:border-white/10"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar name={t.authorName} photoUrl={t.authorPhotoUrl} px={36} />
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{t.authorName}</p>
            <p className="text-[11px] text-gray-400">
              {t.authorRole ? `${t.authorRole} · ` : ""}{fmt(t.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
              t.published
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            {t.published ? <CheckCircle2 size={10} /> : <Clock size={10} />} {t.published ? "Published" : "Draft"}
          </span>
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
            aria-label="Delete testimonial"
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-white/80">{t.content}</p>

      {canTogglePublish && (
        <div className="flex items-center justify-end border-t border-gray-100 dark:border-white/[0.06] pt-3">
          <button
            type="button"
            onClick={toggleStatus}
            disabled={togglePublish.isPending}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
              t.published
                ? "border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-white/10 dark:text-white/60 dark:hover:bg-white/5"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            <CheckCircle2 size={13} /> {t.published ? "Move to draft" : "Publish"}
          </button>
        </div>
      )}
    </div>
  );
}
