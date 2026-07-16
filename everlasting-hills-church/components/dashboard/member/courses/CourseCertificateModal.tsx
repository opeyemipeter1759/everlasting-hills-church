"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ExternalLink, X } from "lucide-react";
import { useMe } from "@/lib/api";
import CertificatePreviewPanel, { certificateNoFor } from "./CertificatePreviewPanel";

export default function CourseCertificateModal({
  open,
  onClose,
  courseId,
  courseSlug,
  courseTitle,
  completedAt,
}: {
  open: boolean;
  onClose: () => void;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  completedAt: string | null;
}) {
  const { data: me } = useMe();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const memberName = `${me?.member?.firstName ?? ""} ${me?.member?.lastName ?? ""}`.trim() || "Member";
  const certificateNo = certificateNoFor(me?.member?.id ?? "member", courseId);

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby="certificate-modal-title" className="fixed inset-0 z-50 overflow-y-auto no-scrollbar">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative flex min-h-full items-center justify-center p-3 sm:p-6">
        <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 shadow-2xl">
          <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/8">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#87102C] dark:text-[#e8768a]">
                Certificate of Training
              </p>
              <h2 id="certificate-modal-title" className="mt-0.5 text-base font-bold text-gray-900 dark:text-white truncate">
                {courseTitle}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 sm:px-6 py-5">
            <CertificatePreviewPanel
              memberName={memberName}
              courseTitle={courseTitle}
              completedAt={completedAt}
              certificateNo={certificateNo}
            />

            <Link
              href={`/dashboard/courses/${courseSlug}/certificate`}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#87102C] dark:hover:text-[#e8768a] transition-colors"
            >
              Open full certificate page <ExternalLink size={11} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
