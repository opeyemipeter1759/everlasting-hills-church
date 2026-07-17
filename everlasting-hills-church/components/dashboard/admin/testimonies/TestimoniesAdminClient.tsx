"use client";

import { useState } from "react";
import { MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { useAdminTestimonials, useDeleteTestimonial, type AdminTestimonial } from "@/lib/api/testimonials";
import { Avatar } from "@/components/dashboard/admin/departments/HeadPicker";
import TestimoniesSkeleton from "@/components/ui/skeleton/TestimoniesSkeleton";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import type { ApiError } from "@/lib/api/axios";

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as ApiError)?.message || fallback;
}

export default function TestimoniesAdminClient() {
  const q = useAdminTestimonials();
  const deleteTestimonial = useDeleteTestimonial();
  const [confirmTarget, setConfirmTarget] = useState<AdminTestimonial | null>(null);

  if (q.isLoading) return <TestimoniesSkeleton />;

  const testimonials = q.data ?? [];

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
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div key={t.id} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <Avatar name={t.authorName} photoUrl={t.authorPhotoUrl} px={36} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{t.authorName}</p>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          t.published
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/50"
                        }`}
                      >
                        {t.published ? "Published" : "Draft"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {t.authorRole ? `${t.authorRole} · ` : ""}{fmt(t.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmTarget(t)}
                  className="shrink-0 rounded-lg p-1.5 text-gray-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  aria-label="Delete testimonial"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-700 dark:text-white/80">{t.content}</p>
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
