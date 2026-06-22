'use client';

import { useRef, useState, useCallback } from 'react';
import { X, Loader2, Music, ImageIcon, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api/axios';

export type FileUploadType = 'audio' | 'image';

export type FileUploadProps = {
  type: FileUploadType;
  endpoint: string;
  fieldName?: string;
  value: string;
  onChange: (url: string) => void;
  onDurationDetected?: (seconds: number) => void;
  disabled?: boolean;
};

export default function FileUpload({
  type,
  endpoint,
  fieldName = 'file',
  value,
  onChange,
  onDurationDetected,
  disabled,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setProgress(0);
      const formData = new FormData();
      formData.append(fieldName, file);
      try {
        const res = await apiClient.post<
          { url?: string; audioUrl?: string; imageUrl?: string } | string
        >(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120_000,
          onUploadProgress: (evt) => {
            if (evt.total) setProgress(Math.round((evt.loaded * 100) / evt.total));
          },
        });
        const data = res.data;
        const url =
          typeof data === 'string'
            ? data
            : (data.url ?? data.audioUrl ?? data.imageUrl ?? '');
        onChange(url);
        if (type === 'audio' && url && onDurationDetected) {
          const audio = new Audio(url);
          audio.addEventListener('loadedmetadata', () => {
            if (isFinite(audio.duration)) onDurationDetected(Math.round(audio.duration));
          });
        }
      } catch (err: unknown) {
        setError((err as { message?: string })?.message ?? 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [endpoint, fieldName, onChange, onDurationDetected, type],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !uploading && !disabled) upload(file);
  }

  const isAudio = type === 'audio';
  const accept = isAudio ? 'audio/*' : 'image/*';
  const hint = isAudio ? 'MP3, WAV, M4A, OGG' : 'JPG, PNG, WebP, GIF';

  return (
    <div className="space-y-1.5">
      <input ref={inputRef} type="file" accept={accept} onChange={handleInputChange} disabled={disabled || uploading} className="hidden" />
      {!value ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => !uploading && !disabled && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => e.key === 'Enter' && !disabled && inputRef.current?.click()}
          className={['flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-7 transition-colors', disabled || uploading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer', dragging ? 'border-[#87102C]/60 bg-[#87102C]/[0.04]' : 'border-gray-200 dark:border-white/10 hover:border-[#87102C]/40 hover:bg-[#87102C]/[0.02]'].join(' ')}
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="animate-spin text-[#87102C]" />
              <p className="font-sans text-xs text-gray-500 dark:text-gray-400">Uploading… {progress}%</p>
              <div className="w-40 h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-[#87102C] rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <>
              {isAudio ? <Music size={22} className="text-gray-300 dark:text-gray-600" /> : <ImageIcon size={22} className="text-gray-300 dark:text-gray-600" />}
              <div className="text-center">
                <p className="font-sans text-xs font-medium text-gray-500 dark:text-gray-400">Click or drag & drop to upload</p>
                <p className="font-sans text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">{hint}</p>
              </div>
            </>
          )}
        </div>
      ) : isAudio ? (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.04] px-3 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Music size={13} className="text-[#87102C] dark:text-[#e8768a]" />
              <span className="font-sans text-[11px] font-semibold text-gray-600 dark:text-gray-400">Audio uploaded</span>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => !disabled && !uploading && inputRef.current?.click()} disabled={disabled || uploading} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                <RefreshCw size={10} /> Replace
              </button>
              <button type="button" onClick={() => onChange('')} disabled={disabled} className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50">
                <X size={12} />
              </button>
            </div>
          </div>
          <audio src={value} controls className="w-full h-8" />
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
          <img src={value} alt="Thumbnail" className="w-full h-36 object-cover" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button type="button" onClick={() => !disabled && !uploading && inputRef.current?.click()} disabled={disabled || uploading} className="inline-flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-[10px] font-semibold text-white hover:bg-black/75 backdrop-blur-sm transition-colors disabled:opacity-50">
              <RefreshCw size={10} /> Replace
            </button>
            <button type="button" onClick={() => onChange('')} disabled={disabled} className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/55 text-white hover:bg-red-600/70 backdrop-blur-sm transition-colors disabled:opacity-50">
              <X size={12} />
            </button>
          </div>
        </div>
      )}
      {error && <p className="font-sans text-[11px] text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
