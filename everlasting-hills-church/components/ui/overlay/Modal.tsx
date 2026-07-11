"use client";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

const MAX_W = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export default function Modal({ open, onClose, title, description, children, maxWidth = "md" }: ModalProps) {
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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 no-scrollbar overflow-y-auto"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className={`relative w-full ${MAX_W[maxWidth]} rounded-2xl bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-white/10 shadow-2xl max-h-[calc(100vh-2rem)] flex flex-col`}>
          {/* Header — overflow-hidden here keeps rounded corners on the top edge only */}
          <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/8 rounded-t-2xl overflow-hidden shrink-0">
            <div>
              <h2 id="modal-title" className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
              {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors shrink-0"
            >
              <X size={15} />
            </button>
          </div>
          {/* Body */}
          <div className="px-6 py-5 rounded-b-2xl overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
