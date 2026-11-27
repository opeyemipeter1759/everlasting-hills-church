"use client";

import { useRef } from "react";
import { ImageIcon, Loader2, Plus, X } from "lucide-react";
import { usePictureUpload } from "./use-picture-upload";

const inp =
  "w-full text-sm rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40 transition-all placeholder:text-gray-400";

const HINT = "Upload, drag a picture here, or click the field and paste (Ctrl+V). Any image type.";

/** Image URL field: type a URL, upload, drop, or paste a picture. */
export function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, label, error, dragging, take, zone } = usePictureUpload((urls) => onChange(urls[0]));

  return (
    <div className="space-y-1.5" {...zone}>
      <div className={`flex items-center gap-3 rounded-xl transition-shadow ${dragging ? "ring-2 ring-[#87102C]/40 ring-offset-2" : ""}`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-14 w-14 flex-shrink-0 rounded-lg border border-[#E7CDD3] object-cover dark:border-white/10" />
        ) : (
          <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-[#E7CDD3] dark:border-white/15">
            <ImageIcon size={16} className="text-gray-300 dark:text-white/20" />
          </div>
        )}
        <input className={`${inp} flex-1`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Image URL, or paste a picture here" />
        <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif,.tif,.tiff" className="sr-only"
          onChange={(e) => { void take(e.target.files); e.target.value = ""; }} />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-[#E7CDD3] px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-[#FFF4F6] disabled:opacity-50 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/5"
        >
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
          {label ?? "Upload"}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : <p className="text-[11px] text-gray-400 dark:text-white/30">{HINT}</p>}
    </div>
  );
}

/**
 * Compact thumbnail grid for a list of image URLs. Deliberately not one ImageField
 * row per image — at a dozen-plus images that would push the whole page's scroll out
 * to match; tiles pack many images into little vertical space, and the grid itself
 * scrolls within a capped height so the list never grows past it either.
 */
export function ImageListField({ value, onChange, max }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const latest = useRef(value);
  latest.current = value;
  const room = max ? Math.max(0, max - value.length) : 60;
  const { uploading, label, error, dragging, take, zone } = usePictureUpload((urls) => onChange([...latest.current, ...urls]), room);
  const atMax = room === 0;

  return (
    <div className="space-y-1.5" tabIndex={-1} {...(atMax ? {} : zone)}>
      <div className={`grid max-h-64 grid-cols-4 gap-2 overflow-y-auto rounded-lg p-0.5 sm:grid-cols-6 ${dragging ? "ring-2 ring-[#87102C]/40" : ""}`}>
        {value.map((url, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-[#E7CDD3] dark:border-white/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {!atMax && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-[#E7CDD3] text-gray-400 hover:border-[#87102C]/40 hover:text-[#87102C] disabled:opacity-50 dark:border-white/15 dark:text-white/30"
            aria-label="Add images (you can pick several, or paste)"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
          </button>
        )}
      </div>
      <input ref={fileInputRef} type="file" multiple accept="image/*,.heic,.heif,.tif,.tiff" className="sr-only"
        onChange={(e) => { void take(e.target.files); e.target.value = ""; }} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-gray-400 dark:text-white/30">
          {value.length}
          {max ? ` / ${max}` : ""} image{value.length !== 1 ? "s" : ""} · {label ?? "pick several at once, drop them here, or click + and paste"}
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
