"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAdminTestimonials, useDeleteTestimonial, type AdminTestimonial } from "@/lib/api/testimonials";
import TestimoniesSkeleton from "@/components/ui/skeleton/TestimoniesSkeleton";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import { showToast } from "@/components/ui/toast/toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { hasMinRole } from "@/lib/auth/frontend-session";
import { errorMessage } from "./shared";
import { useTestimonyFilters } from "./useTestimonyFilters";
import ReadTabs from "./ReadTabs";
import TestimonyFilters from "./TestimonyFilters";
import TestimonyList from "./TestimonyList";
import TestimonyPager from "./TestimonyPager";

/** Admin view of testimonies: read/unread inbox, filters, paging, and per-testimony actions. */
export default function TestimoniesAdminClient() {
  const q = useAdminTestimonials();
  const deleteTestimonial = useDeleteTestimonial();
  const currentUser = useCurrentUser();
  const [confirmTarget, setConfirmTarget] = useState<AdminTestimonial | null>(null);
  const testimonials = q.data ?? [];
  const f = useTestimonyFilters(testimonials);

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

  if (q.isLoading) return <TestimoniesSkeleton />;

  // Backend gates publish/unpublish at PASTOR+ — hide the toggle for plain
  // ADMIN viewers of this page rather than let them hit a 403.
  const canTogglePublish = hasMinRole(currentUser?.role, "PASTOR");

  return (
    <div className="px-5 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] xs:tracking-[0.2em] text-[#87102C] dark:text-[#e8768a]">
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

      <ReadTabs f={f} />
      <TestimonyFilters f={f} />
      <TestimonyList
        isError={q.isError}
        total={testimonials.length}
        f={f}
        canTogglePublish={canTogglePublish}
        onDelete={setConfirmTarget}
      />
      <TestimonyPager f={f} />

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
