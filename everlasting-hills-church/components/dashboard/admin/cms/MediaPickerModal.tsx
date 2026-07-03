"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ImagePlus, X } from "lucide-react";
import { useMedia, type MediaAsset } from "@/lib/api/cms";

export default function MediaPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
}) {
  const { data: media, isLoading } = useMedia();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-[#140b10] border border-[#E7CDD3]/60 dark:border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E7CDD3]/50 dark:border-white/10">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Choose an image</h2>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 overflow-y-auto">
              {isLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />)}
                </div>
              ) : !media || media.length === 0 ? (
                <div className="py-10 text-center">
                  <ImagePlus size={26} className="mx-auto mb-3 text-gray-300 dark:text-white/20" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No media yet</p>
                  <Link href="/dashboard/cms/media" className="text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline mt-1 inline-block">
                    Upload in the media library →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {media.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { onSelect(m); onClose(); }}
                      className="group aspect-square rounded-xl overflow-hidden border border-[#E7CDD3]/60 dark:border-white/10 hover:ring-2 hover:ring-[#87102C]/40 transition-all"
                      title={m.alt}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt={m.alt} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-[#E7CDD3]/50 dark:border-white/10 text-right">
              <Link href="/dashboard/cms/media" className="text-xs font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline">
                Manage media library →
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
