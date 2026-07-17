"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X as XIcon } from "lucide-react";
import { muted } from "./tokens";

export function QRModal({ memberDisplayId, onClose }: { memberDisplayId: string; onClose: () => void }) {
  const [qrSrc, setQrSrc] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    import("qrcode").then((QRCode) => {
      QRCode.default.toDataURL(memberDisplayId, { width: 220, margin: 2, color: { dark: "#87102C", light: "#fff9fb" } })
        .then((url) => { if (!cancelled) setQrSrc(url); })
        .catch(console.error);
    });
    return () => { cancelled = true; };
  }, [memberDisplayId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 bg-white dark:bg-[#1a0610] rounded-3xl shadow-2xl p-7 flex flex-col items-center gap-4 max-w-xs w-full border border-[#E7CDD3]/60 dark:border-white/[0.12]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <XIcon size={14} className="text-[#8a7e80] dark:text-white/60" />
        </button>

        <div className="p-3 rounded-2xl bg-[#fff9fb] dark:bg-white border border-[#E7CDD3]/60 dark:border-transparent">
          {qrSrc ? (
            <img src={qrSrc} alt={`QR code for ${memberDisplayId}`} className="w-44 h-44" />
          ) : (
            <div className="w-44 h-44 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#87102C]/30 border-t-[#87102C] rounded-full animate-spin" />
            </div>
          )}
        </div>

        <p className={`text-xs ${muted} text-center`}>
          Show this QR to an usher to check in at service
        </p>
      </motion.div>
    </div>
  );
}
