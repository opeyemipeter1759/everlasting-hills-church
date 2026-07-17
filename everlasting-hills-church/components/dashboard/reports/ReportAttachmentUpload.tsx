"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Paperclip, X } from "lucide-react";
import { apiClient } from "@/lib/api/axios";

/** Upload a single .docx/.doc/.pdf attachment for a Report — no inline preview
 * (unlike FileUpload's image/audio players), just a filename chip once uploaded. */
export default function ReportAttachmentUpload({
  url,
  name,
  onChange,
  disabled,
}: {
  url: string;
  name: string;
  onChange: (url: string, name: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await apiClient.post<{ url: string; name: string }>("/uploads/document", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120_000,
      });
      onChange(res.data.url, res.data.name || file.name);
    } catch (err) {
      setError((err as { message?: string })?.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-1.5">
      <input
        ref={inputRef}
        type="file"
        accept=".docx,.doc,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,application/pdf"
        onChange={handleChange}
        disabled={disabled || uploading}
        className="hidden"
      />
      {url ? (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] px-3 py-2.5">
          <FileText size={16} className="shrink-0 text-[#87102C] dark:text-[#e8768a]" />
          <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700 dark:text-gray-300">{name || "Attachment"}</span>
          <button
            type="button"
            onClick={() => onChange("", "")}
            disabled={disabled}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 disabled:opacity-50"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !uploading && !disabled && inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:border-[#87102C]/40 hover:bg-[#87102C]/[0.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Paperclip size={15} />}
          {uploading ? "Uploading…" : "Attach a document (DOCX, DOC, or PDF)"}
        </button>
      )}
      {error && <p className="text-[11px] text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
