"use client";

import { useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/overlay/ConfirmDialog";
import MediaUploadZone from "@/components/dashboard/admin/cms/MediaUploadZone";
import { useDeleteMedia, useMedia, type MediaAsset } from "@/lib/api/cms";

const fmtBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`;

export default function CmsMediaLibrary() {
  const { data: media, isLoading } = useMedia();
  const del = useDeleteMedia();
  const [toDelete, setToDelete] = useState<MediaAsset | null>(null);

  return (
    <div className="space-y-6">
      <MediaUploadZone />

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : !media || media.length === 0 ? (
        <div className="rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 p-5 xs:p-8 sm:p-12 text-center">
          <ImagePlus size={28} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No media yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Upload your first image above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((m) => (
            <div key={m.id} className="group relative rounded-2xl border border-[#E7CDD3]/60 dark:border-white/10 bg-white dark:bg-[#140b10] overflow-hidden">
              <div className="relative aspect-square bg-[#FFF4F6] dark:bg-white/[0.03]">
                <Image
                  src={m.url}
                  alt={m.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
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
