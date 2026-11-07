"use client";

import { useRef } from "react";
import { BookMarked, ImagePlus, Loader2, X } from "lucide-react";
import type { Scripture } from "./article-form";

/** The cover picture (or a button to add one) and the passage the story is about. */
export function CoverAndPassage({ cover, scripture, preview, uploading, onChooseCover, onRemoveCover, onRemovePassage }: {
  cover: string | null;
  scripture: Scripture | null;
  preview: boolean;
  uploading: boolean;
  onChooseCover: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCover: () => void;
  onRemovePassage: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <>
      {cover ? (
        <figure className="relative mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover} alt="Cover" className="w-full object-cover" />
          <button type="button" onClick={onRemoveCover} aria-label="Remove the cover" className="m-pill absolute right-3 top-3 !min-h-9 !px-3">
            <X size={14} aria-hidden="true" /> Remove
          </button>
        </figure>
      ) : (
        !preview && (
          <>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onChooseCover} aria-label="Cover picture" />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="m-muted mb-8 inline-flex items-center gap-2 rounded-full border border-dashed border-[var(--m-line)] px-4 py-2 font-sans text-[13px] font-medium transition-colors hover:border-[var(--m-brand)] hover:text-[var(--m-brand)] disabled:opacity-60"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={15} aria-hidden="true" />}
              {uploading ? "Uploading cover…" : "Add a cover image"}
            </button>
          </>
        )
      )}

      {scripture && (
        <div className="m-muted mb-6 flex items-center gap-2 text-[13px]">
          <BookMarked size={14} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">About {scripture.label}</span>
          <button type="button" onClick={onRemovePassage} aria-label="Remove the passage" className="m-icon-btn !min-h-8 !min-w-8">
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
