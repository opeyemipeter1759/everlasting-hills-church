"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud, X } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import {
  useDeleteMedia,
  useMedia,
  useUploadMedia,
  type MediaAsset,
} from "@/lib/api/cms";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function CmsMediaLibrary() {
  const { data: media, isLoading } = useMedia();
  const upload = useUploadMedia();
  const del = useDeleteMedia();
  const fileRef = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<{ file: File; preview: string } | null>(null);
  const [alt, setAlt] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<MediaAsset | null>(null);

  function pick(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setAlt("");
    setPending({ file, preview: URL.createObjectURL(file) });
  }

  async function doUpload() {
    if (!pending || !alt.trim()) return;
    setUploadError(null);
    try {
      // Capture natural dimensions for images before upload.
      let width: number | undefined;
      let height: number | undefined;
      if (pending.file.type.startsWith("image/")) {
        const dims = await imageDims(pending.preview);
        width = dims?.width;
        height = dims?.height;
      }
      await upload.mutateAsync({ file: pending.file, alt: alt.trim(), width, height });
      URL.revokeObjectURL(pending.preview);
      setPending(null);
      setAlt("");
    } catch (err) {
      setUploadError((err as { message?: string }).message ?? "Upload failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div className="rounded-2xl border border-dashed border-[#E7CDD3] dark:border-white/15 bg-[#FFF4F6]/40 dark:bg-white/[0.02] p-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        {!pending ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-2 py-6 text-[#87102C] dark:text-[#e8768a]"
          >
            <UploadCloud size={28} />
            <span className="text-sm font-semibold">Click to upload an image</span>
            <span className="text-xs text-gray-400 dark:text-white/40">Stored in Cloudflare R2 · alt text required</span>
          </button>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pending.preview} alt="" className="h-28 w-28 rounded-xl object-cover border border-[#E7CDD3] dark:border-white/10" />
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-gray-500 dark:text-white/50 mb-1.5">
                Alt text <span className="text-red-500">*</span> (describe the image for accessibility)
              </label>
              <input
                autoFocus
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="e.g. Congregation worshipping on Sunday morning"
                className="w-full text-sm rounded-xl border border-[#E7CDD3] dark:border-white/10 bg-white dark:bg-white/5 px-3.5 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#87102C]/20 focus:border-[#87102C]/40"
              />
              {uploadError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{uploadError}</p>}
              <div className="flex items-center gap-2 mt-3">
                <button
                  type="button"
                  disabled={!alt.trim() || upload.isPending}
                  onClick={doUpload}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#87102C] text-white text-sm font-semibold hover:bg-[#6E0C24] disabled:opacity-50 transition-colors"
                >
                  <ImagePlus size={15} /> {upload.isPending ? "Uploading…" : "Upload"}
                </button>
                <button
                  type="button"
                  onClick={() => { if (pending) URL.revokeObjectURL(pending.preview); setPending(null); }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/60 hover:bg-gray-100 dark:hover:bg-white/5"
                >
                  <X size={15} /> Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !media || media.length === 0 ? (
        <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 p-12 text-center">
          <ImagePlus size={28} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No media yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Upload your first image above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((m) => (
            <div key={m.id} className="group relative rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] overflow-hidden">
              <div className="aspect-square bg-[#FFF4F6] dark:bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt} className="h-full w-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-gray-700 dark:text-white/70 truncate" title={m.alt}>{m.alt}</p>
                <p className="text-[10px] text-gray-400 dark:text-white/40 mt-0.5">
                  {m.width && m.height ? `${m.width}×${m.height} · ` : ""}{fmtBytes(m.sizeBytes)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setToDelete(m)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-black/60 text-gray-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete media"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete this image?"
        description="It will be removed from the media library. Pages that reference it will show a broken image until updated."
        confirmLabel="Delete"
        tone="danger"
        loading={del.isPending}
        onConfirm={async () => {
          if (!toDelete) return;
          await del.mutateAsync(toDelete.id);
          setToDelete(null);
        }}
        onCancel={() => { if (!del.isPending) setToDelete(null); }}
      />
    </div>
  );
}

function imageDims(src: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
