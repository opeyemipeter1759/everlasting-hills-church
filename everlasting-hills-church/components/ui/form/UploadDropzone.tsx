"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

interface UploadDropzoneProps {
  accept: string;
  maxSizeBytes: number;
  onFile: (file: File) => void;
  selectedName?: string | null;
  hint?: string;
  disabled?: boolean;
}

export function UploadDropzone({
  accept,
  maxSizeBytes,
  onFile,
  selectedName,
  hint,
  disabled = false,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovering, setHovering] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function validateAndForward(file: File) {
    if (file.size > maxSizeBytes) {
      setLocalError(`File too large — max ${(maxSizeBytes / 1024 / 1024).toFixed(0)} MB`);
      return;
    }
    const allowed = accept.split(",").map((a) => a.trim().toLowerCase());
    const matchesType = allowed.some((a) =>
      a.startsWith(".") ? file.name.toLowerCase().endsWith(a) : file.type === a,
    );
    if (!matchesType) {
      setLocalError("Unsupported file type");
      return;
    }
    setLocalError(null);
    onFile(file);
  }

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Upload profile photo"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setHovering(true);
        }}
        onDragLeave={() => setHovering(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setHovering(false);
          const file = e.dataTransfer.files?.[0];
          if (file) validateAndForward(file);
        }}
        className={[
          "relative rounded-2xl border-2 border-dashed transition-all duration-200 px-6 py-10 text-center cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/30 focus-visible:ring-offset-2",
          disabled ? "opacity-60 cursor-not-allowed" : "",
          hovering
            ? "border-[#87102C] bg-[#FFE8ED] dark:border-[#87102C]/70 dark:bg-[#87102C]/[0.12]"
            : "border-[#E7CDD3] bg-[#FFF4F6] hover:border-[#87102C]/60 hover:bg-[#FFE8ED]/70 dark:border-white/[0.12] dark:bg-white/[0.03] dark:hover:border-[#87102C]/60 dark:hover:bg-white/[0.07]",
        ].join(" ")}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-white/10 shadow-sm flex items-center justify-center border border-[#E7CDD3]/80 dark:border-white/[0.14]">
            <Upload size={18} className="text-[#87102C] dark:text-[#FFB3C1]" />
          </div>
          <p className="text-sm">
            <span className="font-semibold text-[#87102C] dark:text-[#FFB3C1]">Click to upload</span>{" "}
            <span className="text-[#5A4A4D] dark:text-white/55">or drag and drop</span>
          </p>
          {hint && <p className="text-xs text-[#8a7e80] dark:text-white/35">{hint}</p>}
          {selectedName && !localError && (
            <p className="text-xs text-[#111] dark:text-white/70 mt-1 truncate max-w-full">
              Selected: <span className="font-semibold">{selectedName}</span>
            </p>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) validateAndForward(file);
            e.target.value = "";
          }}
        />
      </div>
      {localError && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-2" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}
