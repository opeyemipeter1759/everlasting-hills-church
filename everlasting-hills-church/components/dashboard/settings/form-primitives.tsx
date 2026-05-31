"use client";

import { forwardRef, useRef, useState } from "react";
import { Upload, type LucideIcon } from "lucide-react";

/* ── Shared tokens ────────────────────────────────────────────────────────── */

const inputBase =
  "w-full text-sm text-[#111] placeholder:text-[#a8a3a4] " +
  "bg-white border border-[#E7CDD3]/60 rounded-xl " +
  "px-4 py-3 transition-all duration-200 " +
  "focus:outline-none focus:border-[#87102C] focus:ring-2 focus:ring-[#87102C]/15 " +
  "disabled:bg-[#FFF4F6] disabled:text-[#6E6364] disabled:cursor-not-allowed";

const labelBase =
  "block text-xs font-semibold text-[#5A4A4D] mb-2 tracking-wide";

/* ── FormInput ────────────────────────────────────────────────────────────── */

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    { label, required, icon: Icon, error, hint, id, className, ...rest },
    ref,
  ) {
    const inputId = id ?? `f-${label.replace(/\s+/g, "-").toLowerCase()}`;
    return (
      <div>
        <label htmlFor={inputId} className={labelBase}>
          {label} {required && <span className="text-[#87102C]">*</span>}
        </label>
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-err` : undefined}
            className={`${inputBase} ${Icon ? "pr-11" : ""} ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
                : ""
            } ${className ?? ""}`}
            {...rest}
          />
          {Icon && (
            <Icon
              size={16}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#87102C]/55 pointer-events-none"
            />
          )}
        </div>
        {error ? (
          <p id={`${inputId}-err`} className="text-xs text-red-600 mt-1.5">
            {error}
          </p>
        ) : hint ? (
          <p className="text-xs text-[#8a7e80] mt-1.5">{hint}</p>
        ) : null}
      </div>
    );
  },
);

/* ── FormTextarea ─────────────────────────────────────────────────────────── */

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  hint?: string;
  maxLengthHint?: number;
  value?: string;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    { label, icon: Icon, error, hint, maxLengthHint, value, id, className, ...rest },
    ref,
  ) {
    const inputId = id ?? `t-${label.replace(/\s+/g, "-").toLowerCase()}`;
    const used = typeof value === "string" ? value.length : 0;
    return (
      <div>
        <label htmlFor={inputId} className={labelBase}>
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <Icon
              size={16}
              className="absolute left-4 top-4 text-[#87102C]/55 pointer-events-none"
            />
          )}
          <textarea
            id={inputId}
            ref={ref}
            value={value}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-err` : undefined}
            className={`${inputBase} resize-y min-h-[120px] leading-relaxed ${
              Icon ? "pl-11" : ""
            } ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/15"
                : ""
            } ${className ?? ""}`}
            {...rest}
          />
        </div>
        <div className="flex items-start justify-between gap-3 mt-1.5">
          {error ? (
            <p id={`${inputId}-err`} className="text-xs text-red-600">
              {error}
            </p>
          ) : hint ? (
            <p className="text-xs text-[#8a7e80]">{hint}</p>
          ) : (
            <span />
          )}
          {typeof maxLengthHint === "number" && (
            <p
              className={`text-xs tabular-nums ${
                used > maxLengthHint ? "text-red-600" : "text-[#8a7e80]"
              }`}
            >
              {used}/{maxLengthHint}
            </p>
          )}
        </div>
      </div>
    );
  },
);

/* ── UploadDropzone ───────────────────────────────────────────────────────── */

interface UploadDropzoneProps {
  accept: string;
  maxSizeBytes: number;
  onFile: (file: File) => void;
  /** Currently-selected file name to display under the dropzone, optional. */
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
      setLocalError(
        `File too large — max ${(maxSizeBytes / 1024 / 1024).toFixed(0)} MB`,
      );
      return;
    }
    const allowed = accept.split(",").map((a) => a.trim().toLowerCase());
    const matchesType = allowed.some((a) =>
      a.startsWith(".")
        ? file.name.toLowerCase().endsWith(a)
        : file.type === a,
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
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 px-6 py-10 text-center cursor-pointer
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#87102C]/30 focus-visible:ring-offset-2
          ${disabled ? "opacity-60 cursor-not-allowed" : ""}
          ${hovering
            ? "border-[#87102C] bg-[#FFE8ED]"
            : "border-[#E7CDD3] bg-[#FFF4F6] hover:border-[#87102C]/60 hover:bg-[#FFE8ED]/70"}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#E7CDD3]/80">
            <Upload size={18} className="text-[#87102C]" />
          </div>
          <p className="text-sm">
            <span className="font-semibold text-[#87102C]">Click to upload</span>{" "}
            <span className="text-[#5A4A4D]">or drag and drop</span>
          </p>
          {hint && <p className="text-xs text-[#8a7e80]">{hint}</p>}
          {selectedName && !localError && (
            <p className="text-xs text-[#111] mt-1 truncate max-w-full">
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
        <p className="text-xs text-red-600 mt-2" role="alert">
          {localError}
        </p>
      )}
    </div>
  );
}
