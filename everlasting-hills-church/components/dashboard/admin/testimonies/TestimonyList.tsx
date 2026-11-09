import { Mail, MailOpen, MessageSquare, Search } from "lucide-react";
import type { AdminTestimonial } from "@/lib/api/testimonials";
import { EMPTY_BOX } from "./shared";
import TestimonialCard from "./TestimonialCard";
import type { TestimonyFilterState } from "./useTestimonyFilters";

/** The current page of testimonies grouped by day, or the right message when there are none. */
export default function TestimonyList({ isError, total, f, canTogglePublish, onDelete }: {
  isError: boolean;
  /** How many testimonies were loaded before filtering. */
  total: number;
  f: TestimonyFilterState;
  canTogglePublish: boolean;
  onDelete: (t: AdminTestimonial) => void;
}) {
  if (isError) {
    return (
      <p className="rounded-2xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-5 text-sm text-rose-700 dark:text-rose-400">
        Couldn&apos;t load testimonials.
      </p>
    );
  }
  if (total === 0) {
    return (
      <div className={EMPTY_BOX}>
        <MessageSquare size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <p className="text-base font-semibold text-gray-700 dark:text-white/80">No testimonials yet.</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-white/40">Submissions from the public testimony form will show up here as drafts.</p>
      </div>
    );
  }
  if (f.filtered.length === 0 && !f.hasFilters) {
    const unread = f.readTab === "UNREAD";
    const Icon = unread ? MailOpen : Mail;
    return (
      <div className={EMPTY_BOX}>
        <Icon size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <p className="text-base font-semibold text-gray-700 dark:text-white/80">
          {unread ? "You're all caught up." : "Nothing marked read yet."}
        </p>
        <p className="mt-1 text-sm text-gray-400 dark:text-white/40">
          {unread ? "New testimonies will show up here until someone marks them read." : "Use Mark as read on a testimony to move it here."}
        </p>
      </div>
    );
  }
  if (f.filtered.length === 0) {
    return (
      <div className={EMPTY_BOX}>
        <Search size={24} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
        <p className="text-base font-semibold text-gray-700 dark:text-white/80">No testimonials match your filters.</p>
        <button type="button" onClick={f.clearFilters} className="mt-2 text-sm font-semibold text-[#87102C] hover:underline dark:text-[#e8768a]">
          Clear filters
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {f.groups.map((group) => (
        <div key={group.label}>
          <h2 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-white/40">
            {group.label} <span className="font-semibold normal-case text-gray-300 dark:text-white/25">· {group.items.length}</span>
          </h2>
          <div className="space-y-3">
            {group.items.map((t) => (
              <TestimonialCard key={t.id} t={t} canTogglePublish={canTogglePublish} onDelete={() => onDelete(t)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
