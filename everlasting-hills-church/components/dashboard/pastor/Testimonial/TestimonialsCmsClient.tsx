"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import EmptyState from "./EmptyState";
import SkeletonList from "./SkeletonList";
import TestimonialForm from "./TestimonialForm";
import TestimonialRow from "./TestimonialRow";
import type { EditingState } from "./types";
import { useTestimonials } from "./useTestimonials";
export default function TestimonialsCmsClient() {
  const { items, loadError, loadAll, remove, togglePublish } = useTestimonials();
  const [editing, setEditing] = useState<EditingState>({ kind: "closed" });

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Testimonials
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            All Submited Testimonails and You can Decide to publish to the Home Page
            {items && (
              <>
                {" "}· {items.filter((t) => t.published).length} published, {items.filter((t) => !t.published).length} drafts
              </>
            )}
          </p>
        </div>
        {editing.kind === "closed" && (
          <button
            type="button"
            onClick={() => setEditing({ kind: "create" })}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] transition-colors"
          >
            <Plus size={15} />
            New testimonial
          </button>
        )}
      </div>

      {loadError && (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-400">
          {loadError}
        </div>
      )}

      {/* Editor */}
      {editing.kind !== "closed" && (
        <TestimonialForm
          initial={editing.kind === "edit" ? editing.testimonial : null}
          onCancel={() => setEditing({ kind: "closed" })}
          onSaved={async () => {
            setEditing({ kind: "closed" });
            await loadAll();
          }}
        />
      )}

      {items === null && !loadError && <SkeletonList />}

      {items !== null && items.length === 0 && editing.kind === "closed" && <EmptyState />}

      {items !== null && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((t) => (
            <TestimonialRow
              key={t.id}
              testimonial={t}
              onTogglePublish={togglePublish}
              onEdit={(t) => setEditing({ kind: "edit", testimonial: t })}
              onDelete={remove}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
