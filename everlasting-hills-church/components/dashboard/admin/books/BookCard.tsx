import Image from "next/image";
import { BookOpen, Eye, EyeOff, FileText, Pencil, Radio, Trash2 } from "lucide-react";
import type { Book } from "./types";

function StatusBadge({ status }: { status: Book["status"] }) {
  const isDraft = status === "DRAFT";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        isDraft
          ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
      }`}
    >
      {isDraft ? <FileText size={9} /> : <Radio size={9} />}
      {isDraft ? "Draft" : "Published"}
    </span>
  );
}

export default function BookCard({
  b,
  onEdit,
  onDelete,
  onToggleStatus,
  togglingStatus,
}: {
  b: Book;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  togglingStatus: boolean;
}) {
  const isDraft = b.status === "DRAFT";
  return (
    <div className="group flex gap-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#140b10] p-4 sm:p-5 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm transition-all">
      <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
        {b.coverUrl ? (
          <Image src={b.coverUrl} alt="" fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300 dark:text-white/20">
            <BookOpen size={22} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{b.title}</p>
              <StatusBadge status={b.status} />
            </div>
            {b.author && <p className="text-sm text-gray-500 dark:text-white/50 mt-0.5">{b.author}</p>}
            {b.description && (
              <p className="text-sm text-gray-500 dark:text-white/50 mt-1 line-clamp-2">{b.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-auto pt-3">
          <a
            href={b.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#87102C] dark:text-[#e8768a] hover:underline"
          >
            <FileText size={12} /> View PDF
          </a>

          <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={onToggleStatus}
              disabled={togglingStatus}
              title={isDraft ? "Publish" : "Unpublish"}
              aria-label={isDraft ? "Publish" : "Unpublish"}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              {isDraft ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              type="button"
              onClick={onEdit}
              title="Edit"
              aria-label="Edit"
              className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={onDelete}
              title="Delete"
              aria-label="Delete"
              className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
